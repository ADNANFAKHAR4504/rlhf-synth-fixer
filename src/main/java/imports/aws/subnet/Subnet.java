package imports.aws.subnet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet aws_subnet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.536Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.subnet.Subnet")
public class Subnet extends com.hashicorp.cdktf.TerraformResource {

    protected Subnet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Subnet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.subnet.Subnet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet aws_subnet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Subnet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.subnet.SubnetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Subnet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Subnet to import. This parameter is required.
     * @param importFromId The id of the existing Subnet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Subnet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.subnet.Subnet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Subnet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Subnet to import. This parameter is required.
     * @param importFromId The id of the existing Subnet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.subnet.Subnet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.subnet.SubnetTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAssignIpv6AddressOnCreation() {
        software.amazon.jsii.Kernel.call(this, "resetAssignIpv6AddressOnCreation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZoneId() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZoneId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetCidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerOwnedIpv4Pool() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerOwnedIpv4Pool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDns64() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDns64", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableLniAtDeviceIndex() {
        software.amazon.jsii.Kernel.call(this, "resetEnableLniAtDeviceIndex", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableResourceNameDnsAaaaRecordOnLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetEnableResourceNameDnsAaaaRecordOnLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableResourceNameDnsARecordOnLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetEnableResourceNameDnsARecordOnLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6CidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6CidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Native() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Native", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMapCustomerOwnedIpOnLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetMapCustomerOwnedIpOnLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMapPublicIpOnLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetMapPublicIpOnLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutpostArn() {
        software.amazon.jsii.Kernel.call(this, "resetOutpostArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateDnsHostnameTypeOnLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateDnsHostnameTypeOnLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6CidrBlockAssociationId() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockAssociationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.subnet.SubnetTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.subnet.SubnetTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssignIpv6AddressOnCreationInput() {
        return software.amazon.jsii.Kernel.get(this, "assignIpv6AddressOnCreationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneIdInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "cidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerOwnedIpv4PoolInput() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4PoolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDns64Input() {
        return software.amazon.jsii.Kernel.get(this, "enableDns64Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEnableLniAtDeviceIndexInput() {
        return software.amazon.jsii.Kernel.get(this, "enableLniAtDeviceIndexInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsAaaaRecordOnLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsAaaaRecordOnLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsARecordOnLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsARecordOnLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIpv6NativeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6NativeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMapCustomerOwnedIpOnLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "mapCustomerOwnedIpOnLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMapPublicIpOnLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "mapPublicIpOnLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutpostArnInput() {
        return software.amazon.jsii.Kernel.get(this, "outpostArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateDnsHostnameTypeOnLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsHostnameTypeOnLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAssignIpv6AddressOnCreation() {
        return software.amazon.jsii.Kernel.get(this, "assignIpv6AddressOnCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAssignIpv6AddressOnCreation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "assignIpv6AddressOnCreation", java.util.Objects.requireNonNull(value, "assignIpv6AddressOnCreation is required"));
    }

    public void setAssignIpv6AddressOnCreation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "assignIpv6AddressOnCreation", java.util.Objects.requireNonNull(value, "assignIpv6AddressOnCreation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZoneId() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZoneId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZoneId", java.util.Objects.requireNonNull(value, "availabilityZoneId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cidrBlock", java.util.Objects.requireNonNull(value, "cidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerOwnedIpv4Pool() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerOwnedIpv4Pool(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerOwnedIpv4Pool", java.util.Objects.requireNonNull(value, "customerOwnedIpv4Pool is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDns64() {
        return software.amazon.jsii.Kernel.get(this, "enableDns64", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDns64(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDns64", java.util.Objects.requireNonNull(value, "enableDns64 is required"));
    }

    public void setEnableDns64(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDns64", java.util.Objects.requireNonNull(value, "enableDns64 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEnableLniAtDeviceIndex() {
        return software.amazon.jsii.Kernel.get(this, "enableLniAtDeviceIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEnableLniAtDeviceIndex(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "enableLniAtDeviceIndex", java.util.Objects.requireNonNull(value, "enableLniAtDeviceIndex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableResourceNameDnsAaaaRecordOnLaunch() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsAaaaRecordOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableResourceNameDnsAaaaRecordOnLaunch(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsAaaaRecordOnLaunch", java.util.Objects.requireNonNull(value, "enableResourceNameDnsAaaaRecordOnLaunch is required"));
    }

    public void setEnableResourceNameDnsAaaaRecordOnLaunch(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsAaaaRecordOnLaunch", java.util.Objects.requireNonNull(value, "enableResourceNameDnsAaaaRecordOnLaunch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableResourceNameDnsARecordOnLaunch() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsARecordOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableResourceNameDnsARecordOnLaunch(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsARecordOnLaunch", java.util.Objects.requireNonNull(value, "enableResourceNameDnsARecordOnLaunch is required"));
    }

    public void setEnableResourceNameDnsARecordOnLaunch(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableResourceNameDnsARecordOnLaunch", java.util.Objects.requireNonNull(value, "enableResourceNameDnsARecordOnLaunch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6CidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpv6CidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipv6CidrBlock", java.util.Objects.requireNonNull(value, "ipv6CidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIpv6Native() {
        return software.amazon.jsii.Kernel.get(this, "ipv6Native", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIpv6Native(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Native", java.util.Objects.requireNonNull(value, "ipv6Native is required"));
    }

    public void setIpv6Native(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Native", java.util.Objects.requireNonNull(value, "ipv6Native is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMapCustomerOwnedIpOnLaunch() {
        return software.amazon.jsii.Kernel.get(this, "mapCustomerOwnedIpOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMapCustomerOwnedIpOnLaunch(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "mapCustomerOwnedIpOnLaunch", java.util.Objects.requireNonNull(value, "mapCustomerOwnedIpOnLaunch is required"));
    }

    public void setMapCustomerOwnedIpOnLaunch(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "mapCustomerOwnedIpOnLaunch", java.util.Objects.requireNonNull(value, "mapCustomerOwnedIpOnLaunch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMapPublicIpOnLaunch() {
        return software.amazon.jsii.Kernel.get(this, "mapPublicIpOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMapPublicIpOnLaunch(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "mapPublicIpOnLaunch", java.util.Objects.requireNonNull(value, "mapPublicIpOnLaunch is required"));
    }

    public void setMapPublicIpOnLaunch(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "mapPublicIpOnLaunch", java.util.Objects.requireNonNull(value, "mapPublicIpOnLaunch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutpostArn() {
        return software.amazon.jsii.Kernel.get(this, "outpostArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutpostArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outpostArn", java.util.Objects.requireNonNull(value, "outpostArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateDnsHostnameTypeOnLaunch() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsHostnameTypeOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivateDnsHostnameTypeOnLaunch(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privateDnsHostnameTypeOnLaunch", java.util.Objects.requireNonNull(value, "privateDnsHostnameTypeOnLaunch is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcId", java.util.Objects.requireNonNull(value, "vpcId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.subnet.Subnet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.subnet.Subnet> {
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
        private final imports.aws.subnet.SubnetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.subnet.SubnetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#vpc_id Subnet#vpc_id}.
         * <p>
         * @return {@code this}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#vpc_id Subnet#vpc_id}. This parameter is required.
         */
        public Builder vpcId(final java.lang.String vpcId) {
            this.config.vpcId(vpcId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#assign_ipv6_address_on_creation Subnet#assign_ipv6_address_on_creation}.
         * <p>
         * @return {@code this}
         * @param assignIpv6AddressOnCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#assign_ipv6_address_on_creation Subnet#assign_ipv6_address_on_creation}. This parameter is required.
         */
        public Builder assignIpv6AddressOnCreation(final java.lang.Boolean assignIpv6AddressOnCreation) {
            this.config.assignIpv6AddressOnCreation(assignIpv6AddressOnCreation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#assign_ipv6_address_on_creation Subnet#assign_ipv6_address_on_creation}.
         * <p>
         * @return {@code this}
         * @param assignIpv6AddressOnCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#assign_ipv6_address_on_creation Subnet#assign_ipv6_address_on_creation}. This parameter is required.
         */
        public Builder assignIpv6AddressOnCreation(final com.hashicorp.cdktf.IResolvable assignIpv6AddressOnCreation) {
            this.config.assignIpv6AddressOnCreation(assignIpv6AddressOnCreation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#availability_zone Subnet#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#availability_zone Subnet#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config.availabilityZone(availabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#availability_zone_id Subnet#availability_zone_id}.
         * <p>
         * @return {@code this}
         * @param availabilityZoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#availability_zone_id Subnet#availability_zone_id}. This parameter is required.
         */
        public Builder availabilityZoneId(final java.lang.String availabilityZoneId) {
            this.config.availabilityZoneId(availabilityZoneId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#cidr_block Subnet#cidr_block}.
         * <p>
         * @return {@code this}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#cidr_block Subnet#cidr_block}. This parameter is required.
         */
        public Builder cidrBlock(final java.lang.String cidrBlock) {
            this.config.cidrBlock(cidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#customer_owned_ipv4_pool Subnet#customer_owned_ipv4_pool}.
         * <p>
         * @return {@code this}
         * @param customerOwnedIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#customer_owned_ipv4_pool Subnet#customer_owned_ipv4_pool}. This parameter is required.
         */
        public Builder customerOwnedIpv4Pool(final java.lang.String customerOwnedIpv4Pool) {
            this.config.customerOwnedIpv4Pool(customerOwnedIpv4Pool);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_dns64 Subnet#enable_dns64}.
         * <p>
         * @return {@code this}
         * @param enableDns64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_dns64 Subnet#enable_dns64}. This parameter is required.
         */
        public Builder enableDns64(final java.lang.Boolean enableDns64) {
            this.config.enableDns64(enableDns64);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_dns64 Subnet#enable_dns64}.
         * <p>
         * @return {@code this}
         * @param enableDns64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_dns64 Subnet#enable_dns64}. This parameter is required.
         */
        public Builder enableDns64(final com.hashicorp.cdktf.IResolvable enableDns64) {
            this.config.enableDns64(enableDns64);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_lni_at_device_index Subnet#enable_lni_at_device_index}.
         * <p>
         * @return {@code this}
         * @param enableLniAtDeviceIndex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_lni_at_device_index Subnet#enable_lni_at_device_index}. This parameter is required.
         */
        public Builder enableLniAtDeviceIndex(final java.lang.Number enableLniAtDeviceIndex) {
            this.config.enableLniAtDeviceIndex(enableLniAtDeviceIndex);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_aaaa_record_on_launch Subnet#enable_resource_name_dns_aaaa_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsAaaaRecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_aaaa_record_on_launch Subnet#enable_resource_name_dns_aaaa_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsAaaaRecordOnLaunch(final java.lang.Boolean enableResourceNameDnsAaaaRecordOnLaunch) {
            this.config.enableResourceNameDnsAaaaRecordOnLaunch(enableResourceNameDnsAaaaRecordOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_aaaa_record_on_launch Subnet#enable_resource_name_dns_aaaa_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsAaaaRecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_aaaa_record_on_launch Subnet#enable_resource_name_dns_aaaa_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsAaaaRecordOnLaunch(final com.hashicorp.cdktf.IResolvable enableResourceNameDnsAaaaRecordOnLaunch) {
            this.config.enableResourceNameDnsAaaaRecordOnLaunch(enableResourceNameDnsAaaaRecordOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_a_record_on_launch Subnet#enable_resource_name_dns_a_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsARecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_a_record_on_launch Subnet#enable_resource_name_dns_a_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsARecordOnLaunch(final java.lang.Boolean enableResourceNameDnsARecordOnLaunch) {
            this.config.enableResourceNameDnsARecordOnLaunch(enableResourceNameDnsARecordOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_a_record_on_launch Subnet#enable_resource_name_dns_a_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsARecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#enable_resource_name_dns_a_record_on_launch Subnet#enable_resource_name_dns_a_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsARecordOnLaunch(final com.hashicorp.cdktf.IResolvable enableResourceNameDnsARecordOnLaunch) {
            this.config.enableResourceNameDnsARecordOnLaunch(enableResourceNameDnsARecordOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#id Subnet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#id Subnet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#ipv6_cidr_block Subnet#ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#ipv6_cidr_block Subnet#ipv6_cidr_block}. This parameter is required.
         */
        public Builder ipv6CidrBlock(final java.lang.String ipv6CidrBlock) {
            this.config.ipv6CidrBlock(ipv6CidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#ipv6_native Subnet#ipv6_native}.
         * <p>
         * @return {@code this}
         * @param ipv6Native Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#ipv6_native Subnet#ipv6_native}. This parameter is required.
         */
        public Builder ipv6Native(final java.lang.Boolean ipv6Native) {
            this.config.ipv6Native(ipv6Native);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#ipv6_native Subnet#ipv6_native}.
         * <p>
         * @return {@code this}
         * @param ipv6Native Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#ipv6_native Subnet#ipv6_native}. This parameter is required.
         */
        public Builder ipv6Native(final com.hashicorp.cdktf.IResolvable ipv6Native) {
            this.config.ipv6Native(ipv6Native);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_customer_owned_ip_on_launch Subnet#map_customer_owned_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapCustomerOwnedIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_customer_owned_ip_on_launch Subnet#map_customer_owned_ip_on_launch}. This parameter is required.
         */
        public Builder mapCustomerOwnedIpOnLaunch(final java.lang.Boolean mapCustomerOwnedIpOnLaunch) {
            this.config.mapCustomerOwnedIpOnLaunch(mapCustomerOwnedIpOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_customer_owned_ip_on_launch Subnet#map_customer_owned_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapCustomerOwnedIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_customer_owned_ip_on_launch Subnet#map_customer_owned_ip_on_launch}. This parameter is required.
         */
        public Builder mapCustomerOwnedIpOnLaunch(final com.hashicorp.cdktf.IResolvable mapCustomerOwnedIpOnLaunch) {
            this.config.mapCustomerOwnedIpOnLaunch(mapCustomerOwnedIpOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_public_ip_on_launch Subnet#map_public_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapPublicIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_public_ip_on_launch Subnet#map_public_ip_on_launch}. This parameter is required.
         */
        public Builder mapPublicIpOnLaunch(final java.lang.Boolean mapPublicIpOnLaunch) {
            this.config.mapPublicIpOnLaunch(mapPublicIpOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_public_ip_on_launch Subnet#map_public_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapPublicIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#map_public_ip_on_launch Subnet#map_public_ip_on_launch}. This parameter is required.
         */
        public Builder mapPublicIpOnLaunch(final com.hashicorp.cdktf.IResolvable mapPublicIpOnLaunch) {
            this.config.mapPublicIpOnLaunch(mapPublicIpOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#outpost_arn Subnet#outpost_arn}.
         * <p>
         * @return {@code this}
         * @param outpostArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#outpost_arn Subnet#outpost_arn}. This parameter is required.
         */
        public Builder outpostArn(final java.lang.String outpostArn) {
            this.config.outpostArn(outpostArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#private_dns_hostname_type_on_launch Subnet#private_dns_hostname_type_on_launch}.
         * <p>
         * @return {@code this}
         * @param privateDnsHostnameTypeOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#private_dns_hostname_type_on_launch Subnet#private_dns_hostname_type_on_launch}. This parameter is required.
         */
        public Builder privateDnsHostnameTypeOnLaunch(final java.lang.String privateDnsHostnameTypeOnLaunch) {
            this.config.privateDnsHostnameTypeOnLaunch(privateDnsHostnameTypeOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#tags Subnet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#tags Subnet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#tags_all Subnet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#tags_all Subnet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/subnet#timeouts Subnet#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.subnet.SubnetTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.subnet.Subnet}.
         */
        @Override
        public imports.aws.subnet.Subnet build() {
            return new imports.aws.subnet.Subnet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
