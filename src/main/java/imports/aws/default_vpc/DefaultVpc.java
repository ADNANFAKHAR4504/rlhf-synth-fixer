package imports.aws.default_vpc;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc aws_default_vpc}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.985Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.defaultVpc.DefaultVpc")
public class DefaultVpc extends com.hashicorp.cdktf.TerraformResource {

    protected DefaultVpc(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DefaultVpc(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.default_vpc.DefaultVpc.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc aws_default_vpc} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DefaultVpc(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.default_vpc.DefaultVpcConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc aws_default_vpc} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DefaultVpc(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DefaultVpc resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DefaultVpc to import. This parameter is required.
     * @param importFromId The id of the existing DefaultVpc that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DefaultVpc to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.default_vpc.DefaultVpc.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DefaultVpc resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DefaultVpc to import. This parameter is required.
     * @param importFromId The id of the existing DefaultVpc that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.default_vpc.DefaultVpc.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAssignGeneratedIpv6CidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetAssignGeneratedIpv6CidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDnsHostnames() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDnsHostnames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDnsSupport() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDnsSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableNetworkAddressUsageMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetEnableNetworkAddressUsageMetrics", software.amazon.jsii.NativeType.VOID);
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

    public void resetIpv6CidrBlockNetworkBorderGroup() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6CidrBlockNetworkBorderGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6IpamPoolId() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6IpamPoolId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6NetmaskLength() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6NetmaskLength", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultNetworkAclId() {
        return software.amazon.jsii.Kernel.get(this, "defaultNetworkAclId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultRouteTableId() {
        return software.amazon.jsii.Kernel.get(this, "defaultRouteTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "defaultSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDhcpOptionsId() {
        return software.amazon.jsii.Kernel.get(this, "dhcpOptionsId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getExistingDefaultVpc() {
        return software.amazon.jsii.Kernel.get(this, "existingDefaultVpc", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceTenancy() {
        return software.amazon.jsii.Kernel.get(this, "instanceTenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6AssociationId() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AssociationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMainRouteTableId() {
        return software.amazon.jsii.Kernel.get(this, "mainRouteTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssignGeneratedIpv6CidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "assignGeneratedIpv6CidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDnsHostnamesInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDnsHostnamesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDnsSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDnsSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableNetworkAddressUsageMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "enableNetworkAddressUsageMetricsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlockNetworkBorderGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockNetworkBorderGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6IpamPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6IpamPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv6NetmaskLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6NetmaskLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAssignGeneratedIpv6CidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "assignGeneratedIpv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAssignGeneratedIpv6CidrBlock(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "assignGeneratedIpv6CidrBlock", java.util.Objects.requireNonNull(value, "assignGeneratedIpv6CidrBlock is required"));
    }

    public void setAssignGeneratedIpv6CidrBlock(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "assignGeneratedIpv6CidrBlock", java.util.Objects.requireNonNull(value, "assignGeneratedIpv6CidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDnsHostnames() {
        return software.amazon.jsii.Kernel.get(this, "enableDnsHostnames", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDnsHostnames(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDnsHostnames", java.util.Objects.requireNonNull(value, "enableDnsHostnames is required"));
    }

    public void setEnableDnsHostnames(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDnsHostnames", java.util.Objects.requireNonNull(value, "enableDnsHostnames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDnsSupport() {
        return software.amazon.jsii.Kernel.get(this, "enableDnsSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDnsSupport(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDnsSupport", java.util.Objects.requireNonNull(value, "enableDnsSupport is required"));
    }

    public void setEnableDnsSupport(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDnsSupport", java.util.Objects.requireNonNull(value, "enableDnsSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableNetworkAddressUsageMetrics() {
        return software.amazon.jsii.Kernel.get(this, "enableNetworkAddressUsageMetrics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableNetworkAddressUsageMetrics(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableNetworkAddressUsageMetrics", java.util.Objects.requireNonNull(value, "enableNetworkAddressUsageMetrics is required"));
    }

    public void setEnableNetworkAddressUsageMetrics(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableNetworkAddressUsageMetrics", java.util.Objects.requireNonNull(value, "enableNetworkAddressUsageMetrics is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6CidrBlockNetworkBorderGroup() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockNetworkBorderGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpv6CidrBlockNetworkBorderGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipv6CidrBlockNetworkBorderGroup", java.util.Objects.requireNonNull(value, "ipv6CidrBlockNetworkBorderGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6IpamPoolId() {
        return software.amazon.jsii.Kernel.get(this, "ipv6IpamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpv6IpamPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipv6IpamPoolId", java.util.Objects.requireNonNull(value, "ipv6IpamPoolId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6NetmaskLength() {
        return software.amazon.jsii.Kernel.get(this, "ipv6NetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv6NetmaskLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv6NetmaskLength", java.util.Objects.requireNonNull(value, "ipv6NetmaskLength is required"));
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
     * A fluent builder for {@link imports.aws.default_vpc.DefaultVpc}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.default_vpc.DefaultVpc> {
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
        private imports.aws.default_vpc.DefaultVpcConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#assign_generated_ipv6_cidr_block DefaultVpc#assign_generated_ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#assign_generated_ipv6_cidr_block DefaultVpc#assign_generated_ipv6_cidr_block}. This parameter is required.
         */
        public Builder assignGeneratedIpv6CidrBlock(final java.lang.Boolean assignGeneratedIpv6CidrBlock) {
            this.config().assignGeneratedIpv6CidrBlock(assignGeneratedIpv6CidrBlock);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#assign_generated_ipv6_cidr_block DefaultVpc#assign_generated_ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#assign_generated_ipv6_cidr_block DefaultVpc#assign_generated_ipv6_cidr_block}. This parameter is required.
         */
        public Builder assignGeneratedIpv6CidrBlock(final com.hashicorp.cdktf.IResolvable assignGeneratedIpv6CidrBlock) {
            this.config().assignGeneratedIpv6CidrBlock(assignGeneratedIpv6CidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_hostnames DefaultVpc#enable_dns_hostnames}.
         * <p>
         * @return {@code this}
         * @param enableDnsHostnames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_hostnames DefaultVpc#enable_dns_hostnames}. This parameter is required.
         */
        public Builder enableDnsHostnames(final java.lang.Boolean enableDnsHostnames) {
            this.config().enableDnsHostnames(enableDnsHostnames);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_hostnames DefaultVpc#enable_dns_hostnames}.
         * <p>
         * @return {@code this}
         * @param enableDnsHostnames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_hostnames DefaultVpc#enable_dns_hostnames}. This parameter is required.
         */
        public Builder enableDnsHostnames(final com.hashicorp.cdktf.IResolvable enableDnsHostnames) {
            this.config().enableDnsHostnames(enableDnsHostnames);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_support DefaultVpc#enable_dns_support}.
         * <p>
         * @return {@code this}
         * @param enableDnsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_support DefaultVpc#enable_dns_support}. This parameter is required.
         */
        public Builder enableDnsSupport(final java.lang.Boolean enableDnsSupport) {
            this.config().enableDnsSupport(enableDnsSupport);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_support DefaultVpc#enable_dns_support}.
         * <p>
         * @return {@code this}
         * @param enableDnsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_dns_support DefaultVpc#enable_dns_support}. This parameter is required.
         */
        public Builder enableDnsSupport(final com.hashicorp.cdktf.IResolvable enableDnsSupport) {
            this.config().enableDnsSupport(enableDnsSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_network_address_usage_metrics DefaultVpc#enable_network_address_usage_metrics}.
         * <p>
         * @return {@code this}
         * @param enableNetworkAddressUsageMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_network_address_usage_metrics DefaultVpc#enable_network_address_usage_metrics}. This parameter is required.
         */
        public Builder enableNetworkAddressUsageMetrics(final java.lang.Boolean enableNetworkAddressUsageMetrics) {
            this.config().enableNetworkAddressUsageMetrics(enableNetworkAddressUsageMetrics);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_network_address_usage_metrics DefaultVpc#enable_network_address_usage_metrics}.
         * <p>
         * @return {@code this}
         * @param enableNetworkAddressUsageMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#enable_network_address_usage_metrics DefaultVpc#enable_network_address_usage_metrics}. This parameter is required.
         */
        public Builder enableNetworkAddressUsageMetrics(final com.hashicorp.cdktf.IResolvable enableNetworkAddressUsageMetrics) {
            this.config().enableNetworkAddressUsageMetrics(enableNetworkAddressUsageMetrics);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#force_destroy DefaultVpc#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#force_destroy DefaultVpc#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final java.lang.Boolean forceDestroy) {
            this.config().forceDestroy(forceDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#force_destroy DefaultVpc#force_destroy}.
         * <p>
         * @return {@code this}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#force_destroy DefaultVpc#force_destroy}. This parameter is required.
         */
        public Builder forceDestroy(final com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.config().forceDestroy(forceDestroy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#id DefaultVpc#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#id DefaultVpc#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_cidr_block DefaultVpc#ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_cidr_block DefaultVpc#ipv6_cidr_block}. This parameter is required.
         */
        public Builder ipv6CidrBlock(final java.lang.String ipv6CidrBlock) {
            this.config().ipv6CidrBlock(ipv6CidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_cidr_block_network_border_group DefaultVpc#ipv6_cidr_block_network_border_group}.
         * <p>
         * @return {@code this}
         * @param ipv6CidrBlockNetworkBorderGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_cidr_block_network_border_group DefaultVpc#ipv6_cidr_block_network_border_group}. This parameter is required.
         */
        public Builder ipv6CidrBlockNetworkBorderGroup(final java.lang.String ipv6CidrBlockNetworkBorderGroup) {
            this.config().ipv6CidrBlockNetworkBorderGroup(ipv6CidrBlockNetworkBorderGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_ipam_pool_id DefaultVpc#ipv6_ipam_pool_id}.
         * <p>
         * @return {@code this}
         * @param ipv6IpamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_ipam_pool_id DefaultVpc#ipv6_ipam_pool_id}. This parameter is required.
         */
        public Builder ipv6IpamPoolId(final java.lang.String ipv6IpamPoolId) {
            this.config().ipv6IpamPoolId(ipv6IpamPoolId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_netmask_length DefaultVpc#ipv6_netmask_length}.
         * <p>
         * @return {@code this}
         * @param ipv6NetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#ipv6_netmask_length DefaultVpc#ipv6_netmask_length}. This parameter is required.
         */
        public Builder ipv6NetmaskLength(final java.lang.Number ipv6NetmaskLength) {
            this.config().ipv6NetmaskLength(ipv6NetmaskLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#tags DefaultVpc#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#tags DefaultVpc#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#tags_all DefaultVpc#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_vpc#tags_all DefaultVpc#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.default_vpc.DefaultVpc}.
         */
        @Override
        public imports.aws.default_vpc.DefaultVpc build() {
            return new imports.aws.default_vpc.DefaultVpc(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.default_vpc.DefaultVpcConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.default_vpc.DefaultVpcConfig.Builder();
            }
            return this.config;
        }
    }
}
