package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanaryArtifactConfigS3EncryptionOutputReference")
public class SyntheticsCanaryArtifactConfigS3EncryptionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SyntheticsCanaryArtifactConfigS3EncryptionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SyntheticsCanaryArtifactConfigS3EncryptionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SyntheticsCanaryArtifactConfigS3EncryptionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEncryptionMode() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionMode() {
        return software.amazon.jsii.Kernel.get(this, "encryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionMode", java.util.Objects.requireNonNull(value, "encryptionMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
