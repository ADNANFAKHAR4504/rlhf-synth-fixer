package imports.aws.networkfirewall_firewall;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.944Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewall.NetworkfirewallFirewallFirewallStatusOutputReference")
public class NetworkfirewallFirewallFirewallStatusOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallFirewallFirewallStatusOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallFirewallFirewallStatusOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public NetworkfirewallFirewallFirewallStatusOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall.NetworkfirewallFirewallFirewallStatusSyncStatesList getSyncStates() {
        return software.amazon.jsii.Kernel.get(this, "syncStates", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall.NetworkfirewallFirewallFirewallStatusSyncStatesList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall.NetworkfirewallFirewallFirewallStatus getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall.NetworkfirewallFirewallFirewallStatus.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall.NetworkfirewallFirewallFirewallStatus value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
