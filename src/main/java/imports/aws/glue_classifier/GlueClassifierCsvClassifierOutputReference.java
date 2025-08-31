package imports.aws.glue_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueClassifier.GlueClassifierCsvClassifierOutputReference")
public class GlueClassifierCsvClassifierOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueClassifierCsvClassifierOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueClassifierCsvClassifierOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueClassifierCsvClassifierOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllowSingleColumn() {
        software.amazon.jsii.Kernel.call(this, "resetAllowSingleColumn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContainsHeader() {
        software.amazon.jsii.Kernel.call(this, "resetContainsHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomDatatypeConfigured() {
        software.amazon.jsii.Kernel.call(this, "resetCustomDatatypeConfigured", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomDatatypes() {
        software.amazon.jsii.Kernel.call(this, "resetCustomDatatypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableValueTrimming() {
        software.amazon.jsii.Kernel.call(this, "resetDisableValueTrimming", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeader() {
        software.amazon.jsii.Kernel.call(this, "resetHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQuoteSymbol() {
        software.amazon.jsii.Kernel.call(this, "resetQuoteSymbol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSerde() {
        software.amazon.jsii.Kernel.call(this, "resetSerde", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowSingleColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "allowSingleColumnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainsHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "containsHeaderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomDatatypeConfiguredInput() {
        return software.amazon.jsii.Kernel.get(this, "customDatatypeConfiguredInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomDatatypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "customDatatypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "delimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableValueTrimmingInput() {
        return software.amazon.jsii.Kernel.get(this, "disableValueTrimmingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHeaderInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "headerInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQuoteSymbolInput() {
        return software.amazon.jsii.Kernel.get(this, "quoteSymbolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSerdeInput() {
        return software.amazon.jsii.Kernel.get(this, "serdeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowSingleColumn() {
        return software.amazon.jsii.Kernel.get(this, "allowSingleColumn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowSingleColumn(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowSingleColumn", java.util.Objects.requireNonNull(value, "allowSingleColumn is required"));
    }

    public void setAllowSingleColumn(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowSingleColumn", java.util.Objects.requireNonNull(value, "allowSingleColumn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainsHeader() {
        return software.amazon.jsii.Kernel.get(this, "containsHeader", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainsHeader(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "containsHeader", java.util.Objects.requireNonNull(value, "containsHeader is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCustomDatatypeConfigured() {
        return software.amazon.jsii.Kernel.get(this, "customDatatypeConfigured", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCustomDatatypeConfigured(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "customDatatypeConfigured", java.util.Objects.requireNonNull(value, "customDatatypeConfigured is required"));
    }

    public void setCustomDatatypeConfigured(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "customDatatypeConfigured", java.util.Objects.requireNonNull(value, "customDatatypeConfigured is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomDatatypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customDatatypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCustomDatatypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "customDatatypes", java.util.Objects.requireNonNull(value, "customDatatypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "delimiter", java.util.Objects.requireNonNull(value, "delimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableValueTrimming() {
        return software.amazon.jsii.Kernel.get(this, "disableValueTrimming", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableValueTrimming(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableValueTrimming", java.util.Objects.requireNonNull(value, "disableValueTrimming is required"));
    }

    public void setDisableValueTrimming(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableValueTrimming", java.util.Objects.requireNonNull(value, "disableValueTrimming is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getHeader() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHeader(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "header", java.util.Objects.requireNonNull(value, "header is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQuoteSymbol() {
        return software.amazon.jsii.Kernel.get(this, "quoteSymbol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQuoteSymbol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "quoteSymbol", java.util.Objects.requireNonNull(value, "quoteSymbol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSerde() {
        return software.amazon.jsii.Kernel.get(this, "serde", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSerde(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serde", java.util.Objects.requireNonNull(value, "serde is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierCsvClassifier getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_classifier.GlueClassifierCsvClassifier.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_classifier.GlueClassifierCsvClassifier value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
