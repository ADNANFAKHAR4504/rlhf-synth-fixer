package imports.aws.network_interface;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface aws_network_interface}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.941Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkInterface.NetworkInterface")
public class NetworkInterface extends com.hashicorp.cdktf.TerraformResource {

    protected NetworkInterface(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkInterface(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.network_interface.NetworkInterface.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface aws_network_interface} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public NetworkInterface(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.network_interface.NetworkInterfaceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a NetworkInterface resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NetworkInterface to import. This parameter is required.
     * @param importFromId The id of the existing NetworkInterface that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the NetworkInterface to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.network_interface.NetworkInterface.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a NetworkInterface resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NetworkInterface to import. This parameter is required.
     * @param importFromId The id of the existing NetworkInterface that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.network_interface.NetworkInterface.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAttachment(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.network_interface.NetworkInterfaceAttachment>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.network_interface.NetworkInterfaceAttachment> __cast_cd4240 = (java.util.List<imports.aws.network_interface.NetworkInterfaceAttachment>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.network_interface.NetworkInterfaceAttachment __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAttachment", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAttachment() {
        software.amazon.jsii.Kernel.call(this, "resetAttachment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnablePrimaryIpv6() {
        software.amazon.jsii.Kernel.call(this, "resetEnablePrimaryIpv6", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInterfaceType() {
        software.amazon.jsii.Kernel.call(this, "resetInterfaceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv4PrefixCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv4PrefixCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv4Prefixes() {
        software.amazon.jsii.Kernel.call(this, "resetIpv4Prefixes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6AddressCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6AddressCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Addresses() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Addresses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6AddressList() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6AddressList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6AddressListEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6AddressListEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6PrefixCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6PrefixCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Prefixes() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Prefixes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIp() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIpList() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIpList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIpListEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIpListEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIps() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIpsCount() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIpsCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDestCheck() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDestCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.network_interface.NetworkInterfaceAttachmentList getAttachment() {
        return software.amazon.jsii.Kernel.get(this, "attachment", software.amazon.jsii.NativeType.forClass(imports.aws.network_interface.NetworkInterfaceAttachmentList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMacAddress() {
        return software.amazon.jsii.Kernel.get(this, "macAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutpostArn() {
        return software.amazon.jsii.Kernel.get(this, "outpostArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateDnsName() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAttachmentInput() {
        return software.amazon.jsii.Kernel.get(this, "attachmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnablePrimaryIpv6Input() {
        return software.amazon.jsii.Kernel.get(this, "enablePrimaryIpv6Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInterfaceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "interfaceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv4PrefixCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv4PrefixCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv4PrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv4PrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv6AddressCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6AddressesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv6AddressesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIpv6AddressListEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressListEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6AddressListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv6AddressListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv6PrefixCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6PrefixCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6PrefixesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv6PrefixesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateIpInput() {
        return software.amazon.jsii.Kernel.get(this, "privateIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrivateIpListEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "privateIpListEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrivateIpListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "privateIpListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPrivateIpsCountInput() {
        return software.amazon.jsii.Kernel.get(this, "privateIpsCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrivateIpsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "privateIpsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceDestCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDestCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnablePrimaryIpv6() {
        return software.amazon.jsii.Kernel.get(this, "enablePrimaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnablePrimaryIpv6(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enablePrimaryIpv6", java.util.Objects.requireNonNull(value, "enablePrimaryIpv6 is required"));
    }

    public void setEnablePrimaryIpv6(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enablePrimaryIpv6", java.util.Objects.requireNonNull(value, "enablePrimaryIpv6 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInterfaceType() {
        return software.amazon.jsii.Kernel.get(this, "interfaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInterfaceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "interfaceType", java.util.Objects.requireNonNull(value, "interfaceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv4PrefixCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv4PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv4PrefixCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv4PrefixCount", java.util.Objects.requireNonNull(value, "ipv4PrefixCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv4Prefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv4Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv4Prefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv4Prefixes", java.util.Objects.requireNonNull(value, "ipv4Prefixes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6AddressCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv6AddressCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv6AddressCount", java.util.Objects.requireNonNull(value, "ipv6AddressCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6Addresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv6Addresses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Addresses", java.util.Objects.requireNonNull(value, "ipv6Addresses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6AddressList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6AddressList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv6AddressList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv6AddressList", java.util.Objects.requireNonNull(value, "ipv6AddressList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIpv6AddressListEnabled() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressListEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIpv6AddressListEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ipv6AddressListEnabled", java.util.Objects.requireNonNull(value, "ipv6AddressListEnabled is required"));
    }

    public void setIpv6AddressListEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ipv6AddressListEnabled", java.util.Objects.requireNonNull(value, "ipv6AddressListEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6PrefixCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv6PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv6PrefixCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv6PrefixCount", java.util.Objects.requireNonNull(value, "ipv6PrefixCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6Prefixes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv6Prefixes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Prefixes", java.util.Objects.requireNonNull(value, "ipv6Prefixes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateIp() {
        return software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivateIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privateIp", java.util.Objects.requireNonNull(value, "privateIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPrivateIpList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "privateIpList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPrivateIpList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "privateIpList", java.util.Objects.requireNonNull(value, "privateIpList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPrivateIpListEnabled() {
        return software.amazon.jsii.Kernel.get(this, "privateIpListEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPrivateIpListEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "privateIpListEnabled", java.util.Objects.requireNonNull(value, "privateIpListEnabled is required"));
    }

    public void setPrivateIpListEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "privateIpListEnabled", java.util.Objects.requireNonNull(value, "privateIpListEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPrivateIps() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "privateIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPrivateIps(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "privateIps", java.util.Objects.requireNonNull(value, "privateIps is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPrivateIpsCount() {
        return software.amazon.jsii.Kernel.get(this, "privateIpsCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPrivateIpsCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "privateIpsCount", java.util.Objects.requireNonNull(value, "privateIpsCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSourceDestCheck() {
        return software.amazon.jsii.Kernel.get(this, "sourceDestCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSourceDestCheck(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sourceDestCheck", java.util.Objects.requireNonNull(value, "sourceDestCheck is required"));
    }

    public void setSourceDestCheck(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sourceDestCheck", java.util.Objects.requireNonNull(value, "sourceDestCheck is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetId", java.util.Objects.requireNonNull(value, "subnetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.network_interface.NetworkInterface}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.network_interface.NetworkInterface> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.network_interface.NetworkInterfaceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.network_interface.NetworkInterfaceConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#subnet_id NetworkInterface#subnet_id}.
         * <p>
         * @return {@code this}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#subnet_id NetworkInterface#subnet_id}. This parameter is required.
         */
        public Builder subnetId(final java.lang.String subnetId) {
            this.config.subnetId(subnetId);
            return this;
        }

        /**
         * attachment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#attachment NetworkInterface#attachment}
         * <p>
         * @return {@code this}
         * @param attachment attachment block. This parameter is required.
         */
        public Builder attachment(final com.hashicorp.cdktf.IResolvable attachment) {
            this.config.attachment(attachment);
            return this;
        }
        /**
         * attachment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#attachment NetworkInterface#attachment}
         * <p>
         * @return {@code this}
         * @param attachment attachment block. This parameter is required.
         */
        public Builder attachment(final java.util.List<? extends imports.aws.network_interface.NetworkInterfaceAttachment> attachment) {
            this.config.attachment(attachment);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#description NetworkInterface#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#description NetworkInterface#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#enable_primary_ipv6 NetworkInterface#enable_primary_ipv6}.
         * <p>
         * @return {@code this}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#enable_primary_ipv6 NetworkInterface#enable_primary_ipv6}. This parameter is required.
         */
        public Builder enablePrimaryIpv6(final java.lang.Boolean enablePrimaryIpv6) {
            this.config.enablePrimaryIpv6(enablePrimaryIpv6);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#enable_primary_ipv6 NetworkInterface#enable_primary_ipv6}.
         * <p>
         * @return {@code this}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#enable_primary_ipv6 NetworkInterface#enable_primary_ipv6}. This parameter is required.
         */
        public Builder enablePrimaryIpv6(final com.hashicorp.cdktf.IResolvable enablePrimaryIpv6) {
            this.config.enablePrimaryIpv6(enablePrimaryIpv6);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#id NetworkInterface#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#id NetworkInterface#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#interface_type NetworkInterface#interface_type}.
         * <p>
         * @return {@code this}
         * @param interfaceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#interface_type NetworkInterface#interface_type}. This parameter is required.
         */
        public Builder interfaceType(final java.lang.String interfaceType) {
            this.config.interfaceType(interfaceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefix_count NetworkInterface#ipv4_prefix_count}.
         * <p>
         * @return {@code this}
         * @param ipv4PrefixCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefix_count NetworkInterface#ipv4_prefix_count}. This parameter is required.
         */
        public Builder ipv4PrefixCount(final java.lang.Number ipv4PrefixCount) {
            this.config.ipv4PrefixCount(ipv4PrefixCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefixes NetworkInterface#ipv4_prefixes}.
         * <p>
         * @return {@code this}
         * @param ipv4Prefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefixes NetworkInterface#ipv4_prefixes}. This parameter is required.
         */
        public Builder ipv4Prefixes(final java.util.List<java.lang.String> ipv4Prefixes) {
            this.config.ipv4Prefixes(ipv4Prefixes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_count NetworkInterface#ipv6_address_count}.
         * <p>
         * @return {@code this}
         * @param ipv6AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_count NetworkInterface#ipv6_address_count}. This parameter is required.
         */
        public Builder ipv6AddressCount(final java.lang.Number ipv6AddressCount) {
            this.config.ipv6AddressCount(ipv6AddressCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_addresses NetworkInterface#ipv6_addresses}.
         * <p>
         * @return {@code this}
         * @param ipv6Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_addresses NetworkInterface#ipv6_addresses}. This parameter is required.
         */
        public Builder ipv6Addresses(final java.util.List<java.lang.String> ipv6Addresses) {
            this.config.ipv6Addresses(ipv6Addresses);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list NetworkInterface#ipv6_address_list}.
         * <p>
         * @return {@code this}
         * @param ipv6AddressList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list NetworkInterface#ipv6_address_list}. This parameter is required.
         */
        public Builder ipv6AddressList(final java.util.List<java.lang.String> ipv6AddressList) {
            this.config.ipv6AddressList(ipv6AddressList);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list_enabled NetworkInterface#ipv6_address_list_enabled}.
         * <p>
         * @return {@code this}
         * @param ipv6AddressListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list_enabled NetworkInterface#ipv6_address_list_enabled}. This parameter is required.
         */
        public Builder ipv6AddressListEnabled(final java.lang.Boolean ipv6AddressListEnabled) {
            this.config.ipv6AddressListEnabled(ipv6AddressListEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list_enabled NetworkInterface#ipv6_address_list_enabled}.
         * <p>
         * @return {@code this}
         * @param ipv6AddressListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list_enabled NetworkInterface#ipv6_address_list_enabled}. This parameter is required.
         */
        public Builder ipv6AddressListEnabled(final com.hashicorp.cdktf.IResolvable ipv6AddressListEnabled) {
            this.config.ipv6AddressListEnabled(ipv6AddressListEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefix_count NetworkInterface#ipv6_prefix_count}.
         * <p>
         * @return {@code this}
         * @param ipv6PrefixCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefix_count NetworkInterface#ipv6_prefix_count}. This parameter is required.
         */
        public Builder ipv6PrefixCount(final java.lang.Number ipv6PrefixCount) {
            this.config.ipv6PrefixCount(ipv6PrefixCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefixes NetworkInterface#ipv6_prefixes}.
         * <p>
         * @return {@code this}
         * @param ipv6Prefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefixes NetworkInterface#ipv6_prefixes}. This parameter is required.
         */
        public Builder ipv6Prefixes(final java.util.List<java.lang.String> ipv6Prefixes) {
            this.config.ipv6Prefixes(ipv6Prefixes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip NetworkInterface#private_ip}.
         * <p>
         * @return {@code this}
         * @param privateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip NetworkInterface#private_ip}. This parameter is required.
         */
        public Builder privateIp(final java.lang.String privateIp) {
            this.config.privateIp(privateIp);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list NetworkInterface#private_ip_list}.
         * <p>
         * @return {@code this}
         * @param privateIpList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list NetworkInterface#private_ip_list}. This parameter is required.
         */
        public Builder privateIpList(final java.util.List<java.lang.String> privateIpList) {
            this.config.privateIpList(privateIpList);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list_enabled NetworkInterface#private_ip_list_enabled}.
         * <p>
         * @return {@code this}
         * @param privateIpListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list_enabled NetworkInterface#private_ip_list_enabled}. This parameter is required.
         */
        public Builder privateIpListEnabled(final java.lang.Boolean privateIpListEnabled) {
            this.config.privateIpListEnabled(privateIpListEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list_enabled NetworkInterface#private_ip_list_enabled}.
         * <p>
         * @return {@code this}
         * @param privateIpListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list_enabled NetworkInterface#private_ip_list_enabled}. This parameter is required.
         */
        public Builder privateIpListEnabled(final com.hashicorp.cdktf.IResolvable privateIpListEnabled) {
            this.config.privateIpListEnabled(privateIpListEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips NetworkInterface#private_ips}.
         * <p>
         * @return {@code this}
         * @param privateIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips NetworkInterface#private_ips}. This parameter is required.
         */
        public Builder privateIps(final java.util.List<java.lang.String> privateIps) {
            this.config.privateIps(privateIps);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips_count NetworkInterface#private_ips_count}.
         * <p>
         * @return {@code this}
         * @param privateIpsCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips_count NetworkInterface#private_ips_count}. This parameter is required.
         */
        public Builder privateIpsCount(final java.lang.Number privateIpsCount) {
            this.config.privateIpsCount(privateIpsCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#security_groups NetworkInterface#security_groups}.
         * <p>
         * @return {@code this}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#security_groups NetworkInterface#security_groups}. This parameter is required.
         */
        public Builder securityGroups(final java.util.List<java.lang.String> securityGroups) {
            this.config.securityGroups(securityGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#source_dest_check NetworkInterface#source_dest_check}.
         * <p>
         * @return {@code this}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#source_dest_check NetworkInterface#source_dest_check}. This parameter is required.
         */
        public Builder sourceDestCheck(final java.lang.Boolean sourceDestCheck) {
            this.config.sourceDestCheck(sourceDestCheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#source_dest_check NetworkInterface#source_dest_check}.
         * <p>
         * @return {@code this}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#source_dest_check NetworkInterface#source_dest_check}. This parameter is required.
         */
        public Builder sourceDestCheck(final com.hashicorp.cdktf.IResolvable sourceDestCheck) {
            this.config.sourceDestCheck(sourceDestCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags NetworkInterface#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags NetworkInterface#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags_all NetworkInterface#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags_all NetworkInterface#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.network_interface.NetworkInterface}.
         */
        @Override
        public imports.aws.network_interface.NetworkInterface build() {
            return new imports.aws.network_interface.NetworkInterface(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
