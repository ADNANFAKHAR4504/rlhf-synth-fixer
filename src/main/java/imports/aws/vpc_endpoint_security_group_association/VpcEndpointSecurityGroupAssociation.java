package imports.aws.vpc_endpoint_security_group_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association aws_vpc_endpoint_security_group_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.593Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcEndpointSecurityGroupAssociation.VpcEndpointSecurityGroupAssociation")
public class VpcEndpointSecurityGroupAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected VpcEndpointSecurityGroupAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpcEndpointSecurityGroupAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association aws_vpc_endpoint_security_group_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VpcEndpointSecurityGroupAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VpcEndpointSecurityGroupAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcEndpointSecurityGroupAssociation to import. This parameter is required.
     * @param importFromId The id of the existing VpcEndpointSecurityGroupAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VpcEndpointSecurityGroupAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VpcEndpointSecurityGroupAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcEndpointSecurityGroupAssociation to import. This parameter is required.
     * @param importFromId The id of the existing VpcEndpointSecurityGroupAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplaceDefaultAssociation() {
        software.amazon.jsii.Kernel.call(this, "resetReplaceDefaultAssociation", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReplaceDefaultAssociationInput() {
        return software.amazon.jsii.Kernel.get(this, "replaceDefaultAssociationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcEndpointIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReplaceDefaultAssociation() {
        return software.amazon.jsii.Kernel.get(this, "replaceDefaultAssociation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReplaceDefaultAssociation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "replaceDefaultAssociation", java.util.Objects.requireNonNull(value, "replaceDefaultAssociation is required"));
    }

    public void setReplaceDefaultAssociation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "replaceDefaultAssociation", java.util.Objects.requireNonNull(value, "replaceDefaultAssociation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupId", java.util.Objects.requireNonNull(value, "securityGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcEndpointId() {
        return software.amazon.jsii.Kernel.get(this, "vpcEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcEndpointId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcEndpointId", java.util.Objects.requireNonNull(value, "vpcEndpointId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation> {
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
        private final imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#security_group_id VpcEndpointSecurityGroupAssociation#security_group_id}.
         * <p>
         * @return {@code this}
         * @param securityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#security_group_id VpcEndpointSecurityGroupAssociation#security_group_id}. This parameter is required.
         */
        public Builder securityGroupId(final java.lang.String securityGroupId) {
            this.config.securityGroupId(securityGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#vpc_endpoint_id VpcEndpointSecurityGroupAssociation#vpc_endpoint_id}.
         * <p>
         * @return {@code this}
         * @param vpcEndpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#vpc_endpoint_id VpcEndpointSecurityGroupAssociation#vpc_endpoint_id}. This parameter is required.
         */
        public Builder vpcEndpointId(final java.lang.String vpcEndpointId) {
            this.config.vpcEndpointId(vpcEndpointId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#id VpcEndpointSecurityGroupAssociation#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#id VpcEndpointSecurityGroupAssociation#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#replace_default_association VpcEndpointSecurityGroupAssociation#replace_default_association}.
         * <p>
         * @return {@code this}
         * @param replaceDefaultAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#replace_default_association VpcEndpointSecurityGroupAssociation#replace_default_association}. This parameter is required.
         */
        public Builder replaceDefaultAssociation(final java.lang.Boolean replaceDefaultAssociation) {
            this.config.replaceDefaultAssociation(replaceDefaultAssociation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#replace_default_association VpcEndpointSecurityGroupAssociation#replace_default_association}.
         * <p>
         * @return {@code this}
         * @param replaceDefaultAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_security_group_association#replace_default_association VpcEndpointSecurityGroupAssociation#replace_default_association}. This parameter is required.
         */
        public Builder replaceDefaultAssociation(final com.hashicorp.cdktf.IResolvable replaceDefaultAssociation) {
            this.config.replaceDefaultAssociation(replaceDefaultAssociation);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation}.
         */
        @Override
        public imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation build() {
            return new imports.aws.vpc_endpoint_security_group_association.VpcEndpointSecurityGroupAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
