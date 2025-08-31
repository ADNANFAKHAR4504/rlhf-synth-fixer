package imports.aws.data_aws_route53_records;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.832Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53Records.DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfigOutputReference")
public class DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCollectionId() {
        return software.amazon.jsii.Kernel.get(this, "collectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocationName() {
        return software.amazon.jsii.Kernel.get(this, "locationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsCidrRoutingConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
