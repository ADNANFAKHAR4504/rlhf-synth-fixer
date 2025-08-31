package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanaryArtifactConfigOutputReference")
public class SyntheticsCanaryArtifactConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SyntheticsCanaryArtifactConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SyntheticsCanaryArtifactConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SyntheticsCanaryArtifactConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3Encryption(final @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption value) {
        software.amazon.jsii.Kernel.call(this, "putS3Encryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetS3Encryption() {
        software.amazon.jsii.Kernel.call(this, "resetS3Encryption", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3EncryptionOutputReference getS3Encryption() {
        return software.amazon.jsii.Kernel.get(this, "s3Encryption", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3EncryptionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption getS3EncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3EncryptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
