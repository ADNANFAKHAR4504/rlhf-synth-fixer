package imports.aws.ec2_traffic_mirror_filter_rule;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule aws_ec2_traffic_mirror_filter_rule}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.102Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TrafficMirrorFilterRule.Ec2TrafficMirrorFilterRule")
public class Ec2TrafficMirrorFilterRule extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2TrafficMirrorFilterRule(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2TrafficMirrorFilterRule(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule aws_ec2_traffic_mirror_filter_rule} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ec2TrafficMirrorFilterRule(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2TrafficMirrorFilterRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TrafficMirrorFilterRule to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TrafficMirrorFilterRule that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2TrafficMirrorFilterRule to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2TrafficMirrorFilterRule resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TrafficMirrorFilterRule to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TrafficMirrorFilterRule that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDestinationPortRange(final @org.jetbrains.annotations.NotNull imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange value) {
        software.amazon.jsii.Kernel.call(this, "putDestinationPortRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourcePortRange(final @org.jetbrains.annotations.NotNull imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange value) {
        software.amazon.jsii.Kernel.call(this, "putSourcePortRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationPortRange() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationPortRange", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourcePortRange() {
        software.amazon.jsii.Kernel.call(this, "resetSourcePortRange", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRangeOutputReference getDestinationPortRange() {
        return software.amazon.jsii.Kernel.get(this, "destinationPortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRangeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRangeOutputReference getSourcePortRange() {
        return software.amazon.jsii.Kernel.get(this, "sourcePortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRangeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationCidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationCidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange getDestinationPortRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationPortRangeInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuleActionInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRuleNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceCidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceCidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange getSourcePortRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "sourcePortRangeInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrafficDirectionInput() {
        return software.amazon.jsii.Kernel.get(this, "trafficDirectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrafficMirrorFilterIdInput() {
        return software.amazon.jsii.Kernel.get(this, "trafficMirrorFilterIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "destinationCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationCidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationCidrBlock", java.util.Objects.requireNonNull(value, "destinationCidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuleAction() {
        return software.amazon.jsii.Kernel.get(this, "ruleAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuleAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ruleAction", java.util.Objects.requireNonNull(value, "ruleAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRuleNumber() {
        return software.amazon.jsii.Kernel.get(this, "ruleNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRuleNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ruleNumber", java.util.Objects.requireNonNull(value, "ruleNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "sourceCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceCidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceCidrBlock", java.util.Objects.requireNonNull(value, "sourceCidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrafficDirection() {
        return software.amazon.jsii.Kernel.get(this, "trafficDirection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrafficDirection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trafficDirection", java.util.Objects.requireNonNull(value, "trafficDirection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrafficMirrorFilterId() {
        return software.amazon.jsii.Kernel.get(this, "trafficMirrorFilterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrafficMirrorFilterId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trafficMirrorFilterId", java.util.Objects.requireNonNull(value, "trafficMirrorFilterId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule> {
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
        private final imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#destination_cidr_block Ec2TrafficMirrorFilterRule#destination_cidr_block}.
         * <p>
         * @return {@code this}
         * @param destinationCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#destination_cidr_block Ec2TrafficMirrorFilterRule#destination_cidr_block}. This parameter is required.
         */
        public Builder destinationCidrBlock(final java.lang.String destinationCidrBlock) {
            this.config.destinationCidrBlock(destinationCidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_action Ec2TrafficMirrorFilterRule#rule_action}.
         * <p>
         * @return {@code this}
         * @param ruleAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_action Ec2TrafficMirrorFilterRule#rule_action}. This parameter is required.
         */
        public Builder ruleAction(final java.lang.String ruleAction) {
            this.config.ruleAction(ruleAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_number Ec2TrafficMirrorFilterRule#rule_number}.
         * <p>
         * @return {@code this}
         * @param ruleNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_number Ec2TrafficMirrorFilterRule#rule_number}. This parameter is required.
         */
        public Builder ruleNumber(final java.lang.Number ruleNumber) {
            this.config.ruleNumber(ruleNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#source_cidr_block Ec2TrafficMirrorFilterRule#source_cidr_block}.
         * <p>
         * @return {@code this}
         * @param sourceCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#source_cidr_block Ec2TrafficMirrorFilterRule#source_cidr_block}. This parameter is required.
         */
        public Builder sourceCidrBlock(final java.lang.String sourceCidrBlock) {
            this.config.sourceCidrBlock(sourceCidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_direction Ec2TrafficMirrorFilterRule#traffic_direction}.
         * <p>
         * @return {@code this}
         * @param trafficDirection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_direction Ec2TrafficMirrorFilterRule#traffic_direction}. This parameter is required.
         */
        public Builder trafficDirection(final java.lang.String trafficDirection) {
            this.config.trafficDirection(trafficDirection);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_mirror_filter_id Ec2TrafficMirrorFilterRule#traffic_mirror_filter_id}.
         * <p>
         * @return {@code this}
         * @param trafficMirrorFilterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_mirror_filter_id Ec2TrafficMirrorFilterRule#traffic_mirror_filter_id}. This parameter is required.
         */
        public Builder trafficMirrorFilterId(final java.lang.String trafficMirrorFilterId) {
            this.config.trafficMirrorFilterId(trafficMirrorFilterId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#description Ec2TrafficMirrorFilterRule#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#description Ec2TrafficMirrorFilterRule#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * destination_port_range block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#destination_port_range Ec2TrafficMirrorFilterRule#destination_port_range}
         * <p>
         * @return {@code this}
         * @param destinationPortRange destination_port_range block. This parameter is required.
         */
        public Builder destinationPortRange(final imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange destinationPortRange) {
            this.config.destinationPortRange(destinationPortRange);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#id Ec2TrafficMirrorFilterRule#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#id Ec2TrafficMirrorFilterRule#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#protocol Ec2TrafficMirrorFilterRule#protocol}.
         * <p>
         * @return {@code this}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#protocol Ec2TrafficMirrorFilterRule#protocol}. This parameter is required.
         */
        public Builder protocol(final java.lang.Number protocol) {
            this.config.protocol(protocol);
            return this;
        }

        /**
         * source_port_range block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#source_port_range Ec2TrafficMirrorFilterRule#source_port_range}
         * <p>
         * @return {@code this}
         * @param sourcePortRange source_port_range block. This parameter is required.
         */
        public Builder sourcePortRange(final imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange sourcePortRange) {
            this.config.sourcePortRange(sourcePortRange);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule}.
         */
        @Override
        public imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule build() {
            return new imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRule(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
