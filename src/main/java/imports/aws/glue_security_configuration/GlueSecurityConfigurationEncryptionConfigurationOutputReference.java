package imports.aws.glue_security_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueSecurityConfiguration.GlueSecurityConfigurationEncryptionConfigurationOutputReference")
public class GlueSecurityConfigurationEncryptionConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueSecurityConfigurationEncryptionConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueSecurityConfigurationEncryptionConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueSecurityConfigurationEncryptionConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchEncryption(final @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchEncryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJobBookmarksEncryption(final @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption value) {
        software.amazon.jsii.Kernel.call(this, "putJobBookmarksEncryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Encryption(final @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption value) {
        software.amazon.jsii.Kernel.call(this, "putS3Encryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryptionOutputReference getCloudwatchEncryption() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryptionOutputReference getJobBookmarksEncryption() {
        return software.amazon.jsii.Kernel.get(this, "jobBookmarksEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3EncryptionOutputReference getS3Encryption() {
        return software.amazon.jsii.Kernel.get(this, "s3Encryption", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3EncryptionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption getCloudwatchEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchEncryptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationCloudwatchEncryption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption getJobBookmarksEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "jobBookmarksEncryptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationJobBookmarksEncryption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption getS3EncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3EncryptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
