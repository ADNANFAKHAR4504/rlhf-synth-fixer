package imports.aws.signer_signing_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.signerSigningJob.SignerSigningJobDestinationOutputReference")
public class SignerSigningJobDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SignerSigningJobDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SignerSigningJobDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SignerSigningJobDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobDestinationS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobDestinationS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobDestinationS3OutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.signer_signing_job.SignerSigningJobDestinationS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobDestinationS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.signer_signing_job.SignerSigningJobDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.signer_signing_job.SignerSigningJobDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
