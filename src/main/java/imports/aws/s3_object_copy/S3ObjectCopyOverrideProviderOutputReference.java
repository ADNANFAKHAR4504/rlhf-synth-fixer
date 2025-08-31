package imports.aws.s3_object_copy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.292Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ObjectCopy.S3ObjectCopyOverrideProviderOutputReference")
public class S3ObjectCopyOverrideProviderOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ObjectCopyOverrideProviderOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ObjectCopyOverrideProviderOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ObjectCopyOverrideProviderOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDefaultTags(final @org.jetbrains.annotations.NotNull imports.aws.s3_object_copy.S3ObjectCopyOverrideProviderDefaultTags value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDefaultTags() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_object_copy.S3ObjectCopyOverrideProviderDefaultTagsOutputReference getDefaultTags() {
        return software.amazon.jsii.Kernel.get(this, "defaultTags", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object_copy.S3ObjectCopyOverrideProviderDefaultTagsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_object_copy.S3ObjectCopyOverrideProviderDefaultTags getDefaultTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultTagsInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object_copy.S3ObjectCopyOverrideProviderDefaultTags.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_object_copy.S3ObjectCopyOverrideProvider value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
