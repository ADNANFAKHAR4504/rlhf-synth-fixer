package imports.aws.default_subnet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet aws_default_subnet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.984Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.defaultSubnet.DefaultSubnet")
public class DefaultSubnet extends com.hashicorp.cdktf.TerraformResource {

    protected DefaultSubnet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DefaultSubnet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.default_subnet.DefaultSubnet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet aws_default_subnet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DefaultSubnet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.default_subnet.DefaultSubnetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DefaultSubnet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DefaultSubnet to import. This parameter is required.
     * @param importFromId The id of the existing DefaultSubnet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DefaultSubnet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.default_subnet.DefaultSubnet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DefaultSubnet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DefaultSubnet to import. This parameter is required.
     * @param importFromId The id of the existing DefaultSubnet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.default_subnet.DefaultSubnet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.default_subnet.DefaultSubnetTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAssignIpv6AddressOnCreation() {
        software.amazon.jsii.Kernel.call(this, "resetAssignIpv6AddressOnCreation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerOwnedIpv4Pool() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerOwnedIpv4Pool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDns64() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDns64", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableResourceNameDnsAaaaRecordOnLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetEnableResourceNameDnsAaaaRecordOnLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableResourceNameDnsARecordOnLaunch() {
        software.amazon.jsii.Kernel.call(this, "resetEnableResourceNameDnsARecordOnLaunch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForceDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetForceDestroy", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZoneId() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEnableLniAtDeviceIndex() {
        return software.amazon.jsii.Kernel.get(this, "enableLniAtDeviceIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getExistingDefaultSubnet() {
        return software.amazon.jsii.Kernel.get(this, "existingDefaultSubnet", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6CidrBlockAssociationId() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockAssociationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutpostArn() {
        return software.amazon.jsii.Kernel.get(this, "outpostArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.default_subnet.DefaultSubnetTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.default_subnet.DefaultSubnetTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssignIpv6AddressOnCreationInput() {
        return software.amazon.jsii.Kernel.get(this, "assignIpv6AddressOnCreationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerOwnedIpv4PoolInput() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4PoolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDns64Input() {
        return software.amazon.jsii.Kernel.get(this, "enableDns64Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsAaaaRecordOnLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsAaaaRecordOnLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsARecordOnLaunchInput() {
        return software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsARecordOnLaunchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getForceDestroy() {
        return software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
    }

    public void setForceDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "forceDestroy", java.util.Objects.requireNonNull(value, "forceDestroy is required"));
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

    /**
     * A fluent builder for {@link imports.aws.default_subnet.DefaultSubnet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.default_subnet.DefaultSubnet> {
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
        private final imports.aws.default_subnet.DefaultSubnetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.default_subnet.DefaultSubnetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#availability_zone DefaultSubnet#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#availability_zone DefaultSubnet#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config.availabilityZone(availabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#assign_ipv6_address_on_creation DefaultSubnet#assign_ipv6_address_on_creation}.
         * <p>
         * @return {@code this}
         * @param assignIpv6AddressOnCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#assign_ipv6_address_on_creation DefaultSubnet#assign_ipv6_address_on_creation}. This parameter is required.
         */
        public Builder assignIpv6AddressOnCreation(final java.lang.Boolean assignIpv6AddressOnCreation) {
            this.config.assignIpv6AddressOnCreation(assignIpv6AddressOnCreation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#assign_ipv6_address_on_creation DefaultSubnet#assign_ipv6_address_on_creation}.
         * <p>
         * @return {@code this}
         * @param assignIpv6AddressOnCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#assign_ipv6_address_on_creation DefaultSubnet#assign_ipv6_address_on_creation}. This parameter is required.
         */
        public Builder assignIpv6AddressOnCreation(final com.hashicorp.cdktf.IResolvable assignIpv6AddressOnCreation) {
            this.config.assignIpv6AddressOnCreation(assignIpv6AddressOnCreation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#customer_owned_ipv4_pool DefaultSubnet#customer_owned_ipv4_pool}.
         * <p>
         * @return {@code this}
         * @param customerOwnedIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#customer_owned_ipv4_pool DefaultSubnet#customer_owned_ipv4_pool}. This parameter is required.
         */
        public Builder customerOwnedIpv4Pool(final java.lang.String customerOwnedIpv4Pool) {
            this.config.customerOwnedIpv4Pool(customerOwnedIpv4Pool);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_dns64 DefaultSubnet#enable_dns64}.
         * <p>
         * @return {@code this}
         * @param enableDns64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_dns64 DefaultSubnet#enable_dns64}. This parameter is required.
         */
        public Builder enableDns64(final java.lang.Boolean enableDns64) {
            this.config.enableDns64(enableDns64);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_dns64 DefaultSubnet#enable_dns64}.
         * <p>
         * @return {@code this}
         * @param enableDns64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_dns64 DefaultSubnet#enable_dns64}. This parameter is required.
         */
        public Builder enableDns64(final com.hashicorp.cdktf.IResolvable enableDns64) {
            this.config.enableDns64(enableDns64);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_aaaa_record_on_launch DefaultSubnet#enable_resource_name_dns_aaaa_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsAaaaRecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_aaaa_record_on_launch DefaultSubnet#enable_resource_name_dns_aaaa_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsAaaaRecordOnLaunch(final java.lang.Boolean enableResourceNameDnsAaaaRecordOnLaunch) {
            this.config.enableResourceNameDnsAaaaRecordOnLaunch(enableResourceNameDnsAaaaRecordOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_aaaa_record_on_launch DefaultSubnet#enable_resource_name_dns_aaaa_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsAaaaRecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_aaaa_record_on_launch DefaultSubnet#enable_resource_name_dns_aaaa_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsAaaaRecordOnLaunch(final com.hashicorp.cdktf.IResolvable enableResourceNameDnsAaaaRecordOnLaunch) {
            this.config.enableResourceNameDnsAaaaRecordOnLaunch(enableResourceNameDnsAaaaRecordOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_a_record_on_launch DefaultSubnet#enable_resource_name_dns_a_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsARecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_a_record_on_launch DefaultSubnet#enable_resource_name_dns_a_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsARecordOnLaunch(final java.lang.Boolean enableResourceNameDnsARecordOnLaunch) {
            this.config.enableResourceNameDnsARecordOnLaunch(enableResourceNameDnsARecordOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_a_record_on_launch DefaultSubnet#enable_resource_name_dns_a_record_on_launch}.
         * <p>
         * @return {@code this}
         * @param enableResourceNameDnsARecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_a_record_on_launch DefaultSubnet#enable_resource_name_dns_a_record_on_launch}. This parameter is required.
         */
        public Builder enableResourceNameDnsARecordOnLaunch(final com.hashicorp.cdktf.IResolvable enableResourceNameDnsARecordOnLaunch) {
            this.config.enableResourceNameDnsARecordOnLaunch(enableResourceNameDnsARecordOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#force_destroy DefaultSubnet#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#force_destroy DefaultSubnet#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final java.lang.Boolean forceDestroy) {
            this.config.forceDestroy(forceDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#force_destroy DefaultSubnet#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#force_destroy DefaultSubnet#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.config.forceDestroy(forceDestroy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#id DefaultSubnet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#id DefaultSubnet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_cidr_block DefaultSubnet#ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_cidr_block DefaultSubnet#ipv6_cidr_block}. This parameter is required.
         */
        public Builder ipv6CidrBlock(final java.lang.String ipv6CidrBlock) {
            this.config.ipv6CidrBlock(ipv6CidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_native DefaultSubnet#ipv6_native}.
         * <p>
         * @return {@code this}
         * @param ipv6Native Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_native DefaultSubnet#ipv6_native}. This parameter is required.
         */
        public Builder ipv6Native(final java.lang.Boolean ipv6Native) {
            this.config.ipv6Native(ipv6Native);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_native DefaultSubnet#ipv6_native}.
         * <p>
         * @return {@code this}
         * @param ipv6Native Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_native DefaultSubnet#ipv6_native}. This parameter is required.
         */
        public Builder ipv6Native(final com.hashicorp.cdktf.IResolvable ipv6Native) {
            this.config.ipv6Native(ipv6Native);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_customer_owned_ip_on_launch DefaultSubnet#map_customer_owned_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapCustomerOwnedIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_customer_owned_ip_on_launch DefaultSubnet#map_customer_owned_ip_on_launch}. This parameter is required.
         */
        public Builder mapCustomerOwnedIpOnLaunch(final java.lang.Boolean mapCustomerOwnedIpOnLaunch) {
            this.config.mapCustomerOwnedIpOnLaunch(mapCustomerOwnedIpOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_customer_owned_ip_on_launch DefaultSubnet#map_customer_owned_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapCustomerOwnedIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_customer_owned_ip_on_launch DefaultSubnet#map_customer_owned_ip_on_launch}. This parameter is required.
         */
        public Builder mapCustomerOwnedIpOnLaunch(final com.hashicorp.cdktf.IResolvable mapCustomerOwnedIpOnLaunch) {
            this.config.mapCustomerOwnedIpOnLaunch(mapCustomerOwnedIpOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_public_ip_on_launch DefaultSubnet#map_public_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapPublicIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_public_ip_on_launch DefaultSubnet#map_public_ip_on_launch}. This parameter is required.
         */
        public Builder mapPublicIpOnLaunch(final java.lang.Boolean mapPublicIpOnLaunch) {
            this.config.mapPublicIpOnLaunch(mapPublicIpOnLaunch);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_public_ip_on_launch DefaultSubnet#map_public_ip_on_launch}.
         * <p>
         * @return {@code this}
         * @param mapPublicIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_public_ip_on_launch DefaultSubnet#map_public_ip_on_launch}. This parameter is required.
         */
        public Builder mapPublicIpOnLaunch(final com.hashicorp.cdktf.IResolvable mapPublicIpOnLaunch) {
            this.config.mapPublicIpOnLaunch(mapPublicIpOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#private_dns_hostname_type_on_launch DefaultSubnet#private_dns_hostname_type_on_launch}.
         * <p>
         * @return {@code this}
         * @param privateDnsHostnameTypeOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#private_dns_hostname_type_on_launch DefaultSubnet#private_dns_hostname_type_on_launch}. This parameter is required.
         */
        public Builder privateDnsHostnameTypeOnLaunch(final java.lang.String privateDnsHostnameTypeOnLaunch) {
            this.config.privateDnsHostnameTypeOnLaunch(privateDnsHostnameTypeOnLaunch);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags DefaultSubnet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags DefaultSubnet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags_all DefaultSubnet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags_all DefaultSubnet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#timeouts DefaultSubnet#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.default_subnet.DefaultSubnetTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.default_subnet.DefaultSubnet}.
         */
        @Override
        public imports.aws.default_subnet.DefaultSubnet build() {
            return new imports.aws.default_subnet.DefaultSubnet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
