package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableImportTableOutputReference")
public class DynamodbTableImportTableOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DynamodbTableImportTableOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbTableImportTableOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DynamodbTableImportTableOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putInputFormatOptions(final @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions value) {
        software.amazon.jsii.Kernel.call(this, "putInputFormatOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3BucketSource(final @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource value) {
        software.amazon.jsii.Kernel.call(this, "putS3BucketSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInputCompressionType() {
        software.amazon.jsii.Kernel.call(this, "resetInputCompressionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputFormatOptions() {
        software.amazon.jsii.Kernel.call(this, "resetInputFormatOptions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsOutputReference getInputFormatOptions() {
        return software.amazon.jsii.Kernel.get(this, "inputFormatOptions", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSourceOutputReference getS3BucketSource() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketSource", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSourceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputCompressionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "inputCompressionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "inputFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions getInputFormatOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "inputFormatOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource getS3BucketSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketSourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableS3BucketSource.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputCompressionType() {
        return software.amazon.jsii.Kernel.get(this, "inputCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputCompressionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputCompressionType", java.util.Objects.requireNonNull(value, "inputCompressionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputFormat() {
        return software.amazon.jsii.Kernel.get(this, "inputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputFormat", java.util.Objects.requireNonNull(value, "inputFormat is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTable getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTable.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
