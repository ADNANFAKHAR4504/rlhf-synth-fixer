package imports.aws.data_aws_globalaccelerator_custom_routing_accelerator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.662Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsGlobalacceleratorCustomRoutingAccelerator.DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributesOutputReference")
public class DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getFlowLogsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "flowLogsEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFlowLogsS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "flowLogsS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFlowLogsS3Prefix() {
        return software.amazon.jsii.Kernel.get(this, "flowLogsS3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_globalaccelerator_custom_routing_accelerator.DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_globalaccelerator_custom_routing_accelerator.DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_globalaccelerator_custom_routing_accelerator.DataAwsGlobalacceleratorCustomRoutingAcceleratorAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
