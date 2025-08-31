package imports.aws.vpc_ipv6_cidr_block_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association aws_vpc_ipv6_cidr_block_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.607Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpv6CidrBlockAssociation.VpcIpv6CidrBlockAssociation")
public class VpcIpv6CidrBlockAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected VpcIpv6CidrBlockAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpcIpv6CidrBlockAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association aws_vpc_ipv6_cidr_block_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VpcIpv6CidrBlockAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VpcIpv6CidrBlockAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcIpv6CidrBlockAssociation to import. This parameter is required.
     * @param importFromId The id of the existing VpcIpv6CidrBlockAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VpcIpv6CidrBlockAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VpcIpv6CidrBlockAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcIpv6CidrBlockAssociation to import. This parameter is required.
     * @param importFromId The id of the existing VpcIpv6CidrBlockAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAssignGeneratedIpv6CidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetAssignGeneratedIpv6CidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6CidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6CidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6IpamPoolId() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6IpamPoolId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6NetmaskLength() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6NetmaskLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Pool() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Pool", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIpSource() {
        return software.amazon.jsii.Kernel.get(this, "ipSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6AddressAttribute() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressAttribute", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssignGeneratedIpv6CidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "assignGeneratedIpv6CidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6IpamPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6IpamPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv6NetmaskLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6NetmaskLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpv6PoolInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6PoolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6Pool() {
        return software.amazon.jsii.Kernel.get(this, "ipv6Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpv6Pool(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Pool", java.util.Objects.requireNonNull(value, "ipv6Pool is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcId", java.util.Objects.requireNonNull(value, "vpcId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation> {
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
        private final imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#vpc_id VpcIpv6CidrBlockAssociation#vpc_id}.
         * <p>
         * @return {@code this}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#vpc_id VpcIpv6CidrBlockAssociation#vpc_id}. This parameter is required.
         */
        public Builder vpcId(final java.lang.String vpcId) {
            this.config.vpcId(vpcId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#assign_generated_ipv6_cidr_block VpcIpv6CidrBlockAssociation#assign_generated_ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#assign_generated_ipv6_cidr_block VpcIpv6CidrBlockAssociation#assign_generated_ipv6_cidr_block}. This parameter is required.
         */
        public Builder assignGeneratedIpv6CidrBlock(final java.lang.Boolean assignGeneratedIpv6CidrBlock) {
            this.config.assignGeneratedIpv6CidrBlock(assignGeneratedIpv6CidrBlock);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#assign_generated_ipv6_cidr_block VpcIpv6CidrBlockAssociation#assign_generated_ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#assign_generated_ipv6_cidr_block VpcIpv6CidrBlockAssociation#assign_generated_ipv6_cidr_block}. This parameter is required.
         */
        public Builder assignGeneratedIpv6CidrBlock(final com.hashicorp.cdktf.IResolvable assignGeneratedIpv6CidrBlock) {
            this.config.assignGeneratedIpv6CidrBlock(assignGeneratedIpv6CidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#id VpcIpv6CidrBlockAssociation#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#id VpcIpv6CidrBlockAssociation#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_cidr_block VpcIpv6CidrBlockAssociation#ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_cidr_block VpcIpv6CidrBlockAssociation#ipv6_cidr_block}. This parameter is required.
         */
        public Builder ipv6CidrBlock(final java.lang.String ipv6CidrBlock) {
            this.config.ipv6CidrBlock(ipv6CidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_ipam_pool_id VpcIpv6CidrBlockAssociation#ipv6_ipam_pool_id}.
         * <p>
         * @return {@code this}
         * @param ipv6IpamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_ipam_pool_id VpcIpv6CidrBlockAssociation#ipv6_ipam_pool_id}. This parameter is required.
         */
        public Builder ipv6IpamPoolId(final java.lang.String ipv6IpamPoolId) {
            this.config.ipv6IpamPoolId(ipv6IpamPoolId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_netmask_length VpcIpv6CidrBlockAssociation#ipv6_netmask_length}.
         * <p>
         * @return {@code this}
         * @param ipv6NetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_netmask_length VpcIpv6CidrBlockAssociation#ipv6_netmask_length}. This parameter is required.
         */
        public Builder ipv6NetmaskLength(final java.lang.Number ipv6NetmaskLength) {
            this.config.ipv6NetmaskLength(ipv6NetmaskLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_pool VpcIpv6CidrBlockAssociation#ipv6_pool}.
         * <p>
         * @return {@code this}
         * @param ipv6Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_pool VpcIpv6CidrBlockAssociation#ipv6_pool}. This parameter is required.
         */
        public Builder ipv6Pool(final java.lang.String ipv6Pool) {
            this.config.ipv6Pool(ipv6Pool);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#timeouts VpcIpv6CidrBlockAssociation#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation}.
         */
        @Override
        public imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation build() {
            return new imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
