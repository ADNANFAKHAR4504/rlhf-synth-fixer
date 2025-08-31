package imports.aws.ec2_client_vpn_authorization_rule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule aws_ec2_client_vpn_authorization_rule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ClientVpnAuthorizationRule.Ec2ClientVpnAuthorizationRule")
public class Ec2ClientVpnAuthorizationRule extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2ClientVpnAuthorizationRule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2ClientVpnAuthorizationRule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule aws_ec2_client_vpn_authorization_rule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ec2ClientVpnAuthorizationRule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2ClientVpnAuthorizationRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2ClientVpnAuthorizationRule to import. This parameter is required.
     * @param importFromId The id of the existing Ec2ClientVpnAuthorizationRule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2ClientVpnAuthorizationRule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2ClientVpnAuthorizationRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2ClientVpnAuthorizationRule to import. This parameter is required.
     * @param importFromId The id of the existing Ec2ClientVpnAuthorizationRule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetAccessGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthorizeAllGroups() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizeAllGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accessGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAuthorizeAllGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizeAllGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientVpnEndpointIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientVpnEndpointIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetNetworkCidrInput() {
        return software.amazon.jsii.Kernel.get(this, "targetNetworkCidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessGroupId() {
        return software.amazon.jsii.Kernel.get(this, "accessGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessGroupId", java.util.Objects.requireNonNull(value, "accessGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAuthorizeAllGroups() {
        return software.amazon.jsii.Kernel.get(this, "authorizeAllGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAuthorizeAllGroups(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "authorizeAllGroups", java.util.Objects.requireNonNull(value, "authorizeAllGroups is required"));
    }

    public void setAuthorizeAllGroups(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "authorizeAllGroups", java.util.Objects.requireNonNull(value, "authorizeAllGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientVpnEndpointId() {
        return software.amazon.jsii.Kernel.get(this, "clientVpnEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientVpnEndpointId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientVpnEndpointId", java.util.Objects.requireNonNull(value, "clientVpnEndpointId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetNetworkCidr() {
        return software.amazon.jsii.Kernel.get(this, "targetNetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetNetworkCidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetNetworkCidr", java.util.Objects.requireNonNull(value, "targetNetworkCidr is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule> {
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
        private final imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#client_vpn_endpoint_id Ec2ClientVpnAuthorizationRule#client_vpn_endpoint_id}.
         * <p>
         * @return {@code this}
         * @param clientVpnEndpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#client_vpn_endpoint_id Ec2ClientVpnAuthorizationRule#client_vpn_endpoint_id}. This parameter is required.
         */
        public Builder clientVpnEndpointId(final java.lang.String clientVpnEndpointId) {
            this.config.clientVpnEndpointId(clientVpnEndpointId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#target_network_cidr Ec2ClientVpnAuthorizationRule#target_network_cidr}.
         * <p>
         * @return {@code this}
         * @param targetNetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#target_network_cidr Ec2ClientVpnAuthorizationRule#target_network_cidr}. This parameter is required.
         */
        public Builder targetNetworkCidr(final java.lang.String targetNetworkCidr) {
            this.config.targetNetworkCidr(targetNetworkCidr);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#access_group_id Ec2ClientVpnAuthorizationRule#access_group_id}.
         * <p>
         * @return {@code this}
         * @param accessGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#access_group_id Ec2ClientVpnAuthorizationRule#access_group_id}. This parameter is required.
         */
        public Builder accessGroupId(final java.lang.String accessGroupId) {
            this.config.accessGroupId(accessGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#authorize_all_groups Ec2ClientVpnAuthorizationRule#authorize_all_groups}.
         * <p>
         * @return {@code this}
         * @param authorizeAllGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#authorize_all_groups Ec2ClientVpnAuthorizationRule#authorize_all_groups}. This parameter is required.
         */
        public Builder authorizeAllGroups(final java.lang.Boolean authorizeAllGroups) {
            this.config.authorizeAllGroups(authorizeAllGroups);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#authorize_all_groups Ec2ClientVpnAuthorizationRule#authorize_all_groups}.
         * <p>
         * @return {@code this}
         * @param authorizeAllGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#authorize_all_groups Ec2ClientVpnAuthorizationRule#authorize_all_groups}. This parameter is required.
         */
        public Builder authorizeAllGroups(final com.hashicorp.cdktf.IResolvable authorizeAllGroups) {
            this.config.authorizeAllGroups(authorizeAllGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#description Ec2ClientVpnAuthorizationRule#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#description Ec2ClientVpnAuthorizationRule#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#id Ec2ClientVpnAuthorizationRule#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#id Ec2ClientVpnAuthorizationRule#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_authorization_rule#timeouts Ec2ClientVpnAuthorizationRule#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRuleTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule}.
         */
        @Override
        public imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule build() {
            return new imports.aws.ec2_client_vpn_authorization_rule.Ec2ClientVpnAuthorizationRule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
