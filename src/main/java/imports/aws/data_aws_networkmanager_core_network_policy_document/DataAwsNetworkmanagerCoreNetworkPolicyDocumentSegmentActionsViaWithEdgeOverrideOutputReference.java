package imports.aws.data_aws_networkmanager_core_network_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkmanagerCoreNetworkPolicyDocument.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverrideOutputReference")
public class DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverrideOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverrideOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverrideOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverrideOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEdgeSets() {
        software.amazon.jsii.Kernel.call(this, "resetEdgeSets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseEdge() {
        software.amazon.jsii.Kernel.call(this, "resetUseEdge", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseEdgeLocation() {
        software.amazon.jsii.Kernel.call(this, "resetUseEdgeLocation", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEdgeSetsInput() {
        return software.amazon.jsii.Kernel.get(this, "edgeSetsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUseEdgeInput() {
        return software.amazon.jsii.Kernel.get(this, "useEdgeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUseEdgeLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "useEdgeLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEdgeSets() {
        return software.amazon.jsii.Kernel.get(this, "edgeSets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEdgeSets(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "edgeSets", java.util.Objects.requireNonNull(value, "edgeSets is required"));
    }

    public void setEdgeSets(final @org.jetbrains.annotations.NotNull java.util.List<java.util.List<java.lang.String>> value) {
        software.amazon.jsii.Kernel.set(this, "edgeSets", java.util.Objects.requireNonNull(value, "edgeSets is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUseEdge() {
        return software.amazon.jsii.Kernel.get(this, "useEdge", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUseEdge(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "useEdge", java.util.Objects.requireNonNull(value, "useEdge is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUseEdgeLocation() {
        return software.amazon.jsii.Kernel.get(this, "useEdgeLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUseEdgeLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "useEdgeLocation", java.util.Objects.requireNonNull(value, "useEdgeLocation is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_networkmanager_core_network_policy_document.DataAwsNetworkmanagerCoreNetworkPolicyDocumentSegmentActionsViaWithEdgeOverride value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
