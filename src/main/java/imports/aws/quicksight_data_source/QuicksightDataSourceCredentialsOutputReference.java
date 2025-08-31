package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.114Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceCredentialsOutputReference")
public class QuicksightDataSourceCredentialsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSourceCredentialsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSourceCredentialsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSourceCredentialsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCredentialPair(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceCredentialsCredentialPair value) {
        software.amazon.jsii.Kernel.call(this, "putCredentialPair", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCopySourceArn() {
        software.amazon.jsii.Kernel.call(this, "resetCopySourceArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCredentialPair() {
        software.amazon.jsii.Kernel.call(this, "resetCredentialPair", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecretArn() {
        software.amazon.jsii.Kernel.call(this, "resetSecretArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceCredentialsCredentialPairOutputReference getCredentialPair() {
        return software.amazon.jsii.Kernel.get(this, "credentialPair", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceCredentialsCredentialPairOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCopySourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "copySourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceCredentialsCredentialPair getCredentialPairInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialPairInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceCredentialsCredentialPair.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecretArnInput() {
        return software.amazon.jsii.Kernel.get(this, "secretArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCopySourceArn() {
        return software.amazon.jsii.Kernel.get(this, "copySourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCopySourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "copySourceArn", java.util.Objects.requireNonNull(value, "copySourceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecretArn() {
        return software.amazon.jsii.Kernel.get(this, "secretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecretArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secretArn", java.util.Objects.requireNonNull(value, "secretArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceCredentials getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceCredentials.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceCredentials value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
