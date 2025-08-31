package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingDocumentDbEventSourceConfigOutputReference")
public class LambdaEventSourceMappingDocumentDbEventSourceConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaEventSourceMappingDocumentDbEventSourceConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaEventSourceMappingDocumentDbEventSourceConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaEventSourceMappingDocumentDbEventSourceConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCollectionName() {
        software.amazon.jsii.Kernel.call(this, "resetCollectionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFullDocument() {
        software.amazon.jsii.Kernel.call(this, "resetFullDocument", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCollectionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "collectionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFullDocumentInput() {
        return software.amazon.jsii.Kernel.get(this, "fullDocumentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollectionName() {
        return software.amazon.jsii.Kernel.get(this, "collectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCollectionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "collectionName", java.util.Objects.requireNonNull(value, "collectionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFullDocument() {
        return software.amazon.jsii.Kernel.get(this, "fullDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFullDocument(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fullDocument", java.util.Objects.requireNonNull(value, "fullDocument is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingDocumentDbEventSourceConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingDocumentDbEventSourceConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingDocumentDbEventSourceConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
