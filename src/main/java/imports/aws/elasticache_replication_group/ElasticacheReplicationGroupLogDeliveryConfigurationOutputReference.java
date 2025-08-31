package imports.aws.elasticache_replication_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.170Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheReplicationGroup.ElasticacheReplicationGroupLogDeliveryConfigurationOutputReference")
public class ElasticacheReplicationGroupLogDeliveryConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticacheReplicationGroupLogDeliveryConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticacheReplicationGroupLogDeliveryConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ElasticacheReplicationGroupLogDeliveryConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "logFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "logTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destination", java.util.Objects.requireNonNull(value, "destination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationType() {
        return software.amazon.jsii.Kernel.get(this, "destinationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationType", java.util.Objects.requireNonNull(value, "destinationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogFormat() {
        return software.amazon.jsii.Kernel.get(this, "logFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logFormat", java.util.Objects.requireNonNull(value, "logFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogType() {
        return software.amazon.jsii.Kernel.get(this, "logType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logType", java.util.Objects.requireNonNull(value, "logType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
