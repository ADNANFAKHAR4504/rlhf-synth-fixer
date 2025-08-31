package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableImportTableInputFormatOptionsCsvOutputReference")
public class DynamodbTableImportTableInputFormatOptionsCsvOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DynamodbTableImportTableInputFormatOptionsCsvOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbTableImportTableInputFormatOptionsCsvOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DynamodbTableImportTableInputFormatOptionsCsvOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeaderList() {
        software.amazon.jsii.Kernel.call(this, "resetHeaderList", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "delimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHeaderListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "headerListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "delimiter", java.util.Objects.requireNonNull(value, "delimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getHeaderList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "headerList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHeaderList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "headerList", java.util.Objects.requireNonNull(value, "headerList is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTableInputFormatOptionsCsv value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
