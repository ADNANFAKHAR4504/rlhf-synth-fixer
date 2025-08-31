package imports.aws.transcribe_language_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.557Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transcribeLanguageModel.TranscribeLanguageModelInputDataConfigOutputReference")
public class TranscribeLanguageModelInputDataConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TranscribeLanguageModelInputDataConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TranscribeLanguageModelInputDataConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TranscribeLanguageModelInputDataConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTuningDataS3Uri() {
        software.amazon.jsii.Kernel.call(this, "resetTuningDataS3Uri", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "s3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTuningDataS3UriInput() {
        return software.amazon.jsii.Kernel.get(this, "tuningDataS3UriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "dataAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataAccessRoleArn", java.util.Objects.requireNonNull(value, "dataAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Uri", java.util.Objects.requireNonNull(value, "s3Uri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTuningDataS3Uri() {
        return software.amazon.jsii.Kernel.get(this, "tuningDataS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTuningDataS3Uri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tuningDataS3Uri", java.util.Objects.requireNonNull(value, "tuningDataS3Uri is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transcribe_language_model.TranscribeLanguageModelInputDataConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transcribe_language_model.TranscribeLanguageModelInputDataConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transcribe_language_model.TranscribeLanguageModelInputDataConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
