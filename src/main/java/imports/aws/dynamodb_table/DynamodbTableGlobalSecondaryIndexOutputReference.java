package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableGlobalSecondaryIndexOutputReference")
public class DynamodbTableGlobalSecondaryIndexOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DynamodbTableGlobalSecondaryIndexOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbTableGlobalSecondaryIndexOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DynamodbTableGlobalSecondaryIndexOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putOnDemandThroughput(final @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughput value) {
        software.amazon.jsii.Kernel.call(this, "putOnDemandThroughput", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetNonKeyAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetNonKeyAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandThroughput() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandThroughput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRangeKey() {
        software.amazon.jsii.Kernel.call(this, "resetRangeKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetReadCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWriteCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetWriteCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughputOutputReference getOnDemandThroughput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandThroughput", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughputOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHashKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "hashKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNonKeyAttributesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "nonKeyAttributesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughput getOnDemandThroughputInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandThroughputInput", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndexOnDemandThroughput.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProjectionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "projectionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRangeKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "rangeKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReadCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "readCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWriteCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "writeCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHashKey() {
        return software.amazon.jsii.Kernel.get(this, "hashKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHashKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hashKey", java.util.Objects.requireNonNull(value, "hashKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNonKeyAttributes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "nonKeyAttributes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNonKeyAttributes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "nonKeyAttributes", java.util.Objects.requireNonNull(value, "nonKeyAttributes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProjectionType() {
        return software.amazon.jsii.Kernel.get(this, "projectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProjectionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "projectionType", java.util.Objects.requireNonNull(value, "projectionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRangeKey() {
        return software.amazon.jsii.Kernel.get(this, "rangeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRangeKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rangeKey", java.util.Objects.requireNonNull(value, "rangeKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReadCapacity() {
        return software.amazon.jsii.Kernel.get(this, "readCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReadCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "readCapacity", java.util.Objects.requireNonNull(value, "readCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWriteCapacity() {
        return software.amazon.jsii.Kernel.get(this, "writeCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWriteCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "writeCapacity", java.util.Objects.requireNonNull(value, "writeCapacity is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndex value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
