package imports.aws.eip;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip aws_eip}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.149Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eip.Eip")
public class Eip extends com.hashicorp.cdktf.TerraformResource {

    protected Eip(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Eip(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.eip.Eip.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip aws_eip} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public Eip(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.eip.EipConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip aws_eip} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public Eip(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a Eip resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Eip to import. This parameter is required.
     * @param importFromId The id of the existing Eip that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Eip to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.eip.Eip.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Eip resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Eip to import. This parameter is required.
     * @param importFromId The id of the existing Eip that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.eip.Eip.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.eip.EipTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAssociateWithPrivateIp() {
        software.amazon.jsii.Kernel.call(this, "resetAssociateWithPrivateIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerOwnedIpv4Pool() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerOwnedIpv4Pool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomain() {
        software.amazon.jsii.Kernel.call(this, "resetDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstance() {
        software.amazon.jsii.Kernel.call(this, "resetInstance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpamPoolId() {
        software.amazon.jsii.Kernel.call(this, "resetIpamPoolId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkBorderGroup() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkBorderGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterface() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterface", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPublicIpv4Pool() {
        software.amazon.jsii.Kernel.call(this, "resetPublicIpv4Pool", software.amazon.jsii.NativeType.VOID);
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

    public void resetVpc() {
        software.amazon.jsii.Kernel.call(this, "resetVpc", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAllocationId() {
        return software.amazon.jsii.Kernel.get(this, "allocationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationId() {
        return software.amazon.jsii.Kernel.get(this, "associationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCarrierIp() {
        return software.amazon.jsii.Kernel.get(this, "carrierIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerOwnedIp() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateDns() {
        return software.amazon.jsii.Kernel.get(this, "privateDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateIp() {
        return software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPtrRecord() {
        return software.amazon.jsii.Kernel.get(this, "ptrRecord", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicDns() {
        return software.amazon.jsii.Kernel.get(this, "publicDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicIp() {
        return software.amazon.jsii.Kernel.get(this, "publicIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.eip.EipTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eip.EipTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "addressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAssociateWithPrivateIpInput() {
        return software.amazon.jsii.Kernel.get(this, "associateWithPrivateIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerOwnedIpv4PoolInput() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4PoolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "domainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpamPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ipamPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkBorderGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "networkBorderGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPublicIpv4PoolInput() {
        return software.amazon.jsii.Kernel.get(this, "publicIpv4PoolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getVpcInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAddress() {
        return software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "address", java.util.Objects.requireNonNull(value, "address is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociateWithPrivateIp() {
        return software.amazon.jsii.Kernel.get(this, "associateWithPrivateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAssociateWithPrivateIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "associateWithPrivateIp", java.util.Objects.requireNonNull(value, "associateWithPrivateIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerOwnedIpv4Pool() {
        return software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerOwnedIpv4Pool(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerOwnedIpv4Pool", java.util.Objects.requireNonNull(value, "customerOwnedIpv4Pool is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomain() {
        return software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domain", java.util.Objects.requireNonNull(value, "domain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstance() {
        return software.amazon.jsii.Kernel.get(this, "instance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstance(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instance", java.util.Objects.requireNonNull(value, "instance is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpamPoolId() {
        return software.amazon.jsii.Kernel.get(this, "ipamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpamPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipamPoolId", java.util.Objects.requireNonNull(value, "ipamPoolId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkBorderGroup() {
        return software.amazon.jsii.Kernel.get(this, "networkBorderGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkBorderGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkBorderGroup", java.util.Objects.requireNonNull(value, "networkBorderGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterface() {
        return software.amazon.jsii.Kernel.get(this, "networkInterface", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkInterface(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkInterface", java.util.Objects.requireNonNull(value, "networkInterface is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicIpv4Pool() {
        return software.amazon.jsii.Kernel.get(this, "publicIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPublicIpv4Pool(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "publicIpv4Pool", java.util.Objects.requireNonNull(value, "publicIpv4Pool is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getVpc() {
        return software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setVpc(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "vpc", java.util.Objects.requireNonNull(value, "vpc is required"));
    }

    public void setVpc(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "vpc", java.util.Objects.requireNonNull(value, "vpc is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.eip.Eip}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.eip.Eip> {
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
        private imports.aws.eip.EipConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#address Eip#address}.
         * <p>
         * @return {@code this}
         * @param address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#address Eip#address}. This parameter is required.
         */
        public Builder address(final java.lang.String address) {
            this.config().address(address);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#associate_with_private_ip Eip#associate_with_private_ip}.
         * <p>
         * @return {@code this}
         * @param associateWithPrivateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#associate_with_private_ip Eip#associate_with_private_ip}. This parameter is required.
         */
        public Builder associateWithPrivateIp(final java.lang.String associateWithPrivateIp) {
            this.config().associateWithPrivateIp(associateWithPrivateIp);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#customer_owned_ipv4_pool Eip#customer_owned_ipv4_pool}.
         * <p>
         * @return {@code this}
         * @param customerOwnedIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#customer_owned_ipv4_pool Eip#customer_owned_ipv4_pool}. This parameter is required.
         */
        public Builder customerOwnedIpv4Pool(final java.lang.String customerOwnedIpv4Pool) {
            this.config().customerOwnedIpv4Pool(customerOwnedIpv4Pool);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#domain Eip#domain}.
         * <p>
         * @return {@code this}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#domain Eip#domain}. This parameter is required.
         */
        public Builder domain(final java.lang.String domain) {
            this.config().domain(domain);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#id Eip#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#id Eip#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#instance Eip#instance}.
         * <p>
         * @return {@code this}
         * @param instance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#instance Eip#instance}. This parameter is required.
         */
        public Builder instance(final java.lang.String instance) {
            this.config().instance(instance);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#ipam_pool_id Eip#ipam_pool_id}.
         * <p>
         * @return {@code this}
         * @param ipamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#ipam_pool_id Eip#ipam_pool_id}. This parameter is required.
         */
        public Builder ipamPoolId(final java.lang.String ipamPoolId) {
            this.config().ipamPoolId(ipamPoolId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_border_group Eip#network_border_group}.
         * <p>
         * @return {@code this}
         * @param networkBorderGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_border_group Eip#network_border_group}. This parameter is required.
         */
        public Builder networkBorderGroup(final java.lang.String networkBorderGroup) {
            this.config().networkBorderGroup(networkBorderGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_interface Eip#network_interface}.
         * <p>
         * @return {@code this}
         * @param networkInterface Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_interface Eip#network_interface}. This parameter is required.
         */
        public Builder networkInterface(final java.lang.String networkInterface) {
            this.config().networkInterface(networkInterface);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#public_ipv4_pool Eip#public_ipv4_pool}.
         * <p>
         * @return {@code this}
         * @param publicIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#public_ipv4_pool Eip#public_ipv4_pool}. This parameter is required.
         */
        public Builder publicIpv4Pool(final java.lang.String publicIpv4Pool) {
            this.config().publicIpv4Pool(publicIpv4Pool);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags Eip#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags Eip#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags_all Eip#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags_all Eip#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#timeouts Eip#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.eip.EipTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#vpc Eip#vpc}.
         * <p>
         * @return {@code this}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#vpc Eip#vpc}. This parameter is required.
         */
        public Builder vpc(final java.lang.Boolean vpc) {
            this.config().vpc(vpc);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#vpc Eip#vpc}.
         * <p>
         * @return {@code this}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#vpc Eip#vpc}. This parameter is required.
         */
        public Builder vpc(final com.hashicorp.cdktf.IResolvable vpc) {
            this.config().vpc(vpc);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.eip.Eip}.
         */
        @Override
        public imports.aws.eip.Eip build() {
            return new imports.aws.eip.Eip(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.eip.EipConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.eip.EipConfig.Builder();
            }
            return this.config;
        }
    }
}
