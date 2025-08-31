package imports.aws.cloudfront_monitoring_subscription;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontMonitoringSubscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionOutputReference")
public class CloudfrontMonitoringSubscriptionMonitoringSubscriptionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontMonitoringSubscriptionMonitoringSubscriptionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontMonitoringSubscriptionMonitoringSubscriptionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontMonitoringSubscriptionMonitoringSubscriptionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRealtimeMetricsSubscriptionConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig value) {
        software.amazon.jsii.Kernel.call(this, "putRealtimeMetricsSubscriptionConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfigOutputReference getRealtimeMetricsSubscriptionConfig() {
        return software.amazon.jsii.Kernel.get(this, "realtimeMetricsSubscriptionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig getRealtimeMetricsSubscriptionConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "realtimeMetricsSubscriptionConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscriptionRealtimeMetricsSubscriptionConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscription getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscription.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_monitoring_subscription.CloudfrontMonitoringSubscriptionMonitoringSubscription value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
