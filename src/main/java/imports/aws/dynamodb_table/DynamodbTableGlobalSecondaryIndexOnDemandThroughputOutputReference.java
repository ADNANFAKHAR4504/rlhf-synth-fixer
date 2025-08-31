package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableGlobalSecondaryIndexOnDemandThroughputOutputReference")
public class DynamodbTableGlobalSecondaryIndexOnDemandThroughputOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DynamodbTableGlobalSecondaryIndexOnDemandThroughputOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbTableGlobalSecondaryIndexOnDemandThroughputOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DynamodbTableGlobalSecondaryIndexOnDemandThroughputOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxReadRequestUnits() {
        software.amazon.jsii.Kernel.call(this, "resetMaxReadRequestUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxWriteRequestUnits() {
        software.amazon.jsii.Kernel.call(this, "resetMaxWriteRequestUnits", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxReadRequestUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxReadRequestUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxWriteRequestUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxWriteRequestUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxReadRequestUnits() {
        return software.amazon.jsii.Kernel.get(this, "maxReadRequestUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxReadRequestUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxReadRequestUnits", java.util.Objects.requireNonNull(value, "maxReadRequestUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxWriteRequestUnits() {
        return software.amazon.jsii.Kernel.get(this, "maxWriteRequestUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxWriteRequestUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxWriteRequestUnits", java.util.Objects.requireNonNull(value, "maxWriteRequestUnits is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughput getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughput.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughput value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
