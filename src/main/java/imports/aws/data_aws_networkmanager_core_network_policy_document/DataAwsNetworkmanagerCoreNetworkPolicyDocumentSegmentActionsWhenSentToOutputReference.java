package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentToOutputReference")
public class DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentToOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentToOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentToOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentToOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSegments() {
        software.amazon.jsii.Kernel.call(this, "resetSegments", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSegmentsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "segmentsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSegments() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "segments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSegments(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "segments", java.util.Objects.requireNonNull(value, "segments is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsWhenSentTo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
