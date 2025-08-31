package imports.aws.data_aws_route53_records;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.832Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53Records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinatesOutputReference")
public class DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinatesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinatesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinatesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinatesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLatitude() {
        return software.amazon.jsii.Kernel.get(this, "latitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLongitude() {
        return software.amazon.jsii.Kernel.get(this, "longitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinates getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinates.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_records.DataAwsRoute53RecordsResourceRecordSetsGeoproximityLocationCoordinates value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
