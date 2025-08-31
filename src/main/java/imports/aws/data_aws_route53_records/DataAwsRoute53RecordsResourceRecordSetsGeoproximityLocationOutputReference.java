package imports.aws.data_aws_route53_records;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.832Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53Records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationOutputReference")
public class DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsRegion() {
        return software.amazon.jsii.Kernel.get(this, "awsRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBias() {
        return software.amazon.jsii.Kernel.get(this, "bias", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinatesOutputReference getCoordinates() {
        return software.amazon.jsii.Kernel.get(this, "coordinates", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinatesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalZoneGroup() {
        return software.amazon.jsii.Kernel.get(this, "localZoneGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocation getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocation.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
