package imports.aws.vpc_security_group_ingress_rule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule aws_vpc_security_group_ingress_rule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.613Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcSecurityGroupIngressRule.VpcSecurityGroupIngressRule")
public class VpcSecurityGroupIngressRule extends com.hashicorp.cdktf.TerraformResource {

    protected VpcSecurityGroupIngressRule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpcSecurityGroupIngressRule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule aws_vpc_security_group_ingress_rule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VpcSecurityGroupIngressRule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRuleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VpcSecurityGroupIngressRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcSecurityGroupIngressRule to import. This parameter is required.
     * @param importFromId The id of the existing VpcSecurityGroupIngressRule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VpcSecurityGroupIngressRule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VpcSecurityGroupIngressRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpcSecurityGroupIngressRule to import. This parameter is required.
     * @param importFromId The id of the existing VpcSecurityGroupIngressRule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetCidrIpv4() {
        software.amazon.jsii.Kernel.call(this, "resetCidrIpv4", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCidrIpv6() {
        software.amazon.jsii.Kernel.call(this, "resetCidrIpv6", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFromPort() {
        software.amazon.jsii.Kernel.call(this, "resetFromPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrefixListId() {
        software.amazon.jsii.Kernel.call(this, "resetPrefixListId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReferencedSecurityGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetReferencedSecurityGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetToPort() {
        software.amazon.jsii.Kernel.call(this, "resetToPort", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityGroupRuleId() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupRuleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCidrIpv4Input() {
        return software.amazon.jsii.Kernel.get(this, "cidrIpv4Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCidrIpv6Input() {
        return software.amazon.jsii.Kernel.get(this, "cidrIpv6Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFromPortInput() {
        return software.amazon.jsii.Kernel.get(this, "fromPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "ipProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixListIdInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixListIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReferencedSecurityGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "referencedSecurityGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getToPortInput() {
        return software.amazon.jsii.Kernel.get(this, "toPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCidrIpv4() {
        return software.amazon.jsii.Kernel.get(this, "cidrIpv4", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCidrIpv4(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cidrIpv4", java.util.Objects.requireNonNull(value, "cidrIpv4 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCidrIpv6() {
        return software.amazon.jsii.Kernel.get(this, "cidrIpv6", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCidrIpv6(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cidrIpv6", java.util.Objects.requireNonNull(value, "cidrIpv6 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFromPort() {
        return software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFromPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "fromPort", java.util.Objects.requireNonNull(value, "fromPort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpProtocol() {
        return software.amazon.jsii.Kernel.get(this, "ipProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipProtocol", java.util.Objects.requireNonNull(value, "ipProtocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefixListId() {
        return software.amazon.jsii.Kernel.get(this, "prefixListId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefixListId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefixListId", java.util.Objects.requireNonNull(value, "prefixListId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReferencedSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "referencedSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReferencedSecurityGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "referencedSecurityGroupId", java.util.Objects.requireNonNull(value, "referencedSecurityGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityGroupId() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupId", java.util.Objects.requireNonNull(value, "securityGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getToPort() {
        return software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setToPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "toPort", java.util.Objects.requireNonNull(value, "toPort is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule> {
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
        private final imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRuleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRuleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#ip_protocol VpcSecurityGroupIngressRule#ip_protocol}.
         * <p>
         * @return {@code this}
         * @param ipProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#ip_protocol VpcSecurityGroupIngressRule#ip_protocol}. This parameter is required.
         */
        public Builder ipProtocol(final java.lang.String ipProtocol) {
            this.config.ipProtocol(ipProtocol);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#security_group_id VpcSecurityGroupIngressRule#security_group_id}.
         * <p>
         * @return {@code this}
         * @param securityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#security_group_id VpcSecurityGroupIngressRule#security_group_id}. This parameter is required.
         */
        public Builder securityGroupId(final java.lang.String securityGroupId) {
            this.config.securityGroupId(securityGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv4 VpcSecurityGroupIngressRule#cidr_ipv4}.
         * <p>
         * @return {@code this}
         * @param cidrIpv4 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv4 VpcSecurityGroupIngressRule#cidr_ipv4}. This parameter is required.
         */
        public Builder cidrIpv4(final java.lang.String cidrIpv4) {
            this.config.cidrIpv4(cidrIpv4);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv6 VpcSecurityGroupIngressRule#cidr_ipv6}.
         * <p>
         * @return {@code this}
         * @param cidrIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv6 VpcSecurityGroupIngressRule#cidr_ipv6}. This parameter is required.
         */
        public Builder cidrIpv6(final java.lang.String cidrIpv6) {
            this.config.cidrIpv6(cidrIpv6);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#description VpcSecurityGroupIngressRule#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#description VpcSecurityGroupIngressRule#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#from_port VpcSecurityGroupIngressRule#from_port}.
         * <p>
         * @return {@code this}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#from_port VpcSecurityGroupIngressRule#from_port}. This parameter is required.
         */
        public Builder fromPort(final java.lang.Number fromPort) {
            this.config.fromPort(fromPort);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#prefix_list_id VpcSecurityGroupIngressRule#prefix_list_id}.
         * <p>
         * @return {@code this}
         * @param prefixListId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#prefix_list_id VpcSecurityGroupIngressRule#prefix_list_id}. This parameter is required.
         */
        public Builder prefixListId(final java.lang.String prefixListId) {
            this.config.prefixListId(prefixListId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#referenced_security_group_id VpcSecurityGroupIngressRule#referenced_security_group_id}.
         * <p>
         * @return {@code this}
         * @param referencedSecurityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#referenced_security_group_id VpcSecurityGroupIngressRule#referenced_security_group_id}. This parameter is required.
         */
        public Builder referencedSecurityGroupId(final java.lang.String referencedSecurityGroupId) {
            this.config.referencedSecurityGroupId(referencedSecurityGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#tags VpcSecurityGroupIngressRule#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#tags VpcSecurityGroupIngressRule#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#to_port VpcSecurityGroupIngressRule#to_port}.
         * <p>
         * @return {@code this}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#to_port VpcSecurityGroupIngressRule#to_port}. This parameter is required.
         */
        public Builder toPort(final java.lang.Number toPort) {
            this.config.toPort(toPort);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule}.
         */
        @Override
        public imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule build() {
            return new imports.aws.vpc_security_group_ingress_rule.VpcSecurityGroupIngressRule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
