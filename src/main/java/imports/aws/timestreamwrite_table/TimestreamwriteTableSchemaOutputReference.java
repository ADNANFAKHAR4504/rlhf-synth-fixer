package imports.aws.timestreamwrite_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.557Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamwriteTable.TimestreamwriteTableSchemaOutputReference")
public class TimestreamwriteTableSchemaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TimestreamwriteTableSchemaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TimestreamwriteTableSchemaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TimestreamwriteTableSchemaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCompositePartitionKey(final @org.jetbrains.annotations.NotNull imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey value) {
        software.amazon.jsii.Kernel.call(this, "putCompositePartitionKey", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCompositePartitionKey() {
        software.amazon.jsii.Kernel.call(this, "resetCompositePartitionKey", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKeyOutputReference getCompositePartitionKey() {
        return software.amazon.jsii.Kernel.get(this, "compositePartitionKey", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKeyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey getCompositePartitionKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "compositePartitionKeyInput", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamwrite_table.TimestreamwriteTableSchemaCompositePartitionKey.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.timestreamwrite_table.TimestreamwriteTableSchema getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamwrite_table.TimestreamwriteTableSchema.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.timestreamwrite_table.TimestreamwriteTableSchema value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
