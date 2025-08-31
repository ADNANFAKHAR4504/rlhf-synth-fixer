package imports.aws.elastic_beanstalk_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.162Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticBeanstalkApplication.ElasticBeanstalkApplicationAppversionLifecycleOutputReference")
public class ElasticBeanstalkApplicationAppversionLifecycleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticBeanstalkApplicationAppversionLifecycleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticBeanstalkApplicationAppversionLifecycleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticBeanstalkApplicationAppversionLifecycleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeleteSourceFromS3() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteSourceFromS3", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxAgeInDays() {
        software.amazon.jsii.Kernel.call(this, "resetMaxAgeInDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxCount() {
        software.amazon.jsii.Kernel.call(this, "resetMaxCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeleteSourceFromS3Input() {
        return software.amazon.jsii.Kernel.get(this, "deleteSourceFromS3Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxAgeInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "maxAgeInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxCountInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeleteSourceFromS3() {
        return software.amazon.jsii.Kernel.get(this, "deleteSourceFromS3", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeleteSourceFromS3(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deleteSourceFromS3", java.util.Objects.requireNonNull(value, "deleteSourceFromS3 is required"));
    }

    public void setDeleteSourceFromS3(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deleteSourceFromS3", java.util.Objects.requireNonNull(value, "deleteSourceFromS3 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxAgeInDays() {
        return software.amazon.jsii.Kernel.get(this, "maxAgeInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxAgeInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxAgeInDays", java.util.Objects.requireNonNull(value, "maxAgeInDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxCount() {
        return software.amazon.jsii.Kernel.get(this, "maxCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxCount", java.util.Objects.requireNonNull(value, "maxCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRole() {
        return software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRole", java.util.Objects.requireNonNull(value, "serviceRole is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastic_beanstalk_application.ElasticBeanstalkApplicationAppversionLifecycle getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elastic_beanstalk_application.ElasticBeanstalkApplicationAppversionLifecycle.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elastic_beanstalk_application.ElasticBeanstalkApplicationAppversionLifecycle value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
