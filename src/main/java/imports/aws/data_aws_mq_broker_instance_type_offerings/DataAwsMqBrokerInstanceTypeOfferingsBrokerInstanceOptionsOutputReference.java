package imports.aws.data_aws_mq_broker_instance_type_offerings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.754Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsMqBrokerInstanceTypeOfferings.DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptionsOutputReference")
public class DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_mq_broker_instance_type_offerings.DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptionsAvailabilityZonesList getAvailabilityZones() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_mq_broker_instance_type_offerings.DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptionsAvailabilityZonesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineType() {
        return software.amazon.jsii.Kernel.get(this, "engineType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "hostInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedDeploymentModes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedDeploymentModes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedEngineVersions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedEngineVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_mq_broker_instance_type_offerings.DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_mq_broker_instance_type_offerings.DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_mq_broker_instance_type_offerings.DataAwsMqBrokerInstanceTypeOfferingsBrokerInstanceOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
