package imports.aws.glue_security_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueSecurityConfiguration.GlueSecurityConfigurationEncryptionConfigurationS3EncryptionOutputReference")
public class GlueSecurityConfigurationEncryptionConfigurationS3EncryptionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueSecurityConfigurationEncryptionConfigurationS3EncryptionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueSecurityConfigurationEncryptionConfigurationS3EncryptionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueSecurityConfigurationEncryptionConfigurationS3EncryptionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3EncryptionMode() {
        software.amazon.jsii.Kernel.call(this, "resetS3EncryptionMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3EncryptionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "s3EncryptionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3EncryptionMode() {
        return software.amazon.jsii.Kernel.get(this, "s3EncryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3EncryptionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3EncryptionMode", java.util.Objects.requireNonNull(value, "s3EncryptionMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_security_configuration.GlueSecurityConfigurationEncryptionConfigurationS3Encryption value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
