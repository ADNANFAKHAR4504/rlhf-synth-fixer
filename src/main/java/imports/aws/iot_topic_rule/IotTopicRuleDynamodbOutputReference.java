package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.414Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleDynamodbOutputReference")
public class IotTopicRuleDynamodbOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotTopicRuleDynamodbOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRuleDynamodbOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public IotTopicRuleDynamodbOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetHashKeyType() {
        software.amazon.jsii.Kernel.call(this, "resetHashKeyType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperation() {
        software.amazon.jsii.Kernel.call(this, "resetOperation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPayloadField() {
        software.amazon.jsii.Kernel.call(this, "resetPayloadField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRangeKeyField() {
        software.amazon.jsii.Kernel.call(this, "resetRangeKeyField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRangeKeyType() {
        software.amazon.jsii.Kernel.call(this, "resetRangeKeyType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRangeKeyValue() {
        software.amazon.jsii.Kernel.call(this, "resetRangeKeyValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHashKeyFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "hashKeyFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHashKeyTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "hashKeyTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHashKeyValueInput() {
        return software.amazon.jsii.Kernel.get(this, "hashKeyValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOperationInput() {
        return software.amazon.jsii.Kernel.get(this, "operationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPayloadFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "payloadFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRangeKeyFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "rangeKeyFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRangeKeyTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "rangeKeyTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRangeKeyValueInput() {
        return software.amazon.jsii.Kernel.get(this, "rangeKeyValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableNameInput() {
        return software.amazon.jsii.Kernel.get(this, "tableNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHashKeyField() {
        return software.amazon.jsii.Kernel.get(this, "hashKeyField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHashKeyField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hashKeyField", java.util.Objects.requireNonNull(value, "hashKeyField is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHashKeyType() {
        return software.amazon.jsii.Kernel.get(this, "hashKeyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHashKeyType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hashKeyType", java.util.Objects.requireNonNull(value, "hashKeyType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHashKeyValue() {
        return software.amazon.jsii.Kernel.get(this, "hashKeyValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHashKeyValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hashKeyValue", java.util.Objects.requireNonNull(value, "hashKeyValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperation() {
        return software.amazon.jsii.Kernel.get(this, "operation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOperation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "operation", java.util.Objects.requireNonNull(value, "operation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPayloadField() {
        return software.amazon.jsii.Kernel.get(this, "payloadField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPayloadField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "payloadField", java.util.Objects.requireNonNull(value, "payloadField is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRangeKeyField() {
        return software.amazon.jsii.Kernel.get(this, "rangeKeyField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRangeKeyField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rangeKeyField", java.util.Objects.requireNonNull(value, "rangeKeyField is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRangeKeyType() {
        return software.amazon.jsii.Kernel.get(this, "rangeKeyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRangeKeyType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rangeKeyType", java.util.Objects.requireNonNull(value, "rangeKeyType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRangeKeyValue() {
        return software.amazon.jsii.Kernel.get(this, "rangeKeyValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRangeKeyValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rangeKeyValue", java.util.Objects.requireNonNull(value, "rangeKeyValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableName() {
        return software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableName", java.util.Objects.requireNonNull(value, "tableName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleDynamodb value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
