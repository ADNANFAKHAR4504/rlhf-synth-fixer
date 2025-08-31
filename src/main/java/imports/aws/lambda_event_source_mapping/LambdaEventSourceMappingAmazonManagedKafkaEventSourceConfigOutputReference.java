package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.501Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfigOutputReference")
public class LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConsumerGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetConsumerGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConsumerGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "consumerGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConsumerGroupId() {
        return software.amazon.jsii.Kernel.get(this, "consumerGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConsumerGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "consumerGroupId", java.util.Objects.requireNonNull(value, "consumerGroupId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_event_source_mapping.LambdaEventSourceMappingAmazonManagedKafkaEventSourceConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
