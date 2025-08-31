package imports.aws.ec2_traffic_mirror_filter_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.103Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TrafficMirrorFilterRule.Ec2TrafficMirrorFilterRuleConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2TrafficMirrorFilterRuleConfig.Jsii$Proxy.class)
public interface Ec2TrafficMirrorFilterRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#destination_cidr_block Ec2TrafficMirrorFilterRule#destination_cidr_block}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationCidrBlock();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_action Ec2TrafficMirrorFilterRule#rule_action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_number Ec2TrafficMirrorFilterRule#rule_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRuleNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#source_cidr_block Ec2TrafficMirrorFilterRule#source_cidr_block}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceCidrBlock();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_direction Ec2TrafficMirrorFilterRule#traffic_direction}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrafficDirection();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_mirror_filter_id Ec2TrafficMirrorFilterRule#traffic_mirror_filter_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrafficMirrorFilterId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#description Ec2TrafficMirrorFilterRule#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * destination_port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#destination_port_range Ec2TrafficMirrorFilterRule#destination_port_range}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange getDestinationPortRange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#id Ec2TrafficMirrorFilterRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#protocol Ec2TrafficMirrorFilterRule#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getProtocol() {
        return null;
    }

    /**
     * source_port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#source_port_range Ec2TrafficMirrorFilterRule#source_port_range}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange getSourcePortRange() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2TrafficMirrorFilterRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2TrafficMirrorFilterRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2TrafficMirrorFilterRuleConfig> {
        java.lang.String destinationCidrBlock;
        java.lang.String ruleAction;
        java.lang.Number ruleNumber;
        java.lang.String sourceCidrBlock;
        java.lang.String trafficDirection;
        java.lang.String trafficMirrorFilterId;
        java.lang.String description;
        imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange destinationPortRange;
        java.lang.String id;
        java.lang.Number protocol;
        imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange sourcePortRange;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getDestinationCidrBlock}
         * @param destinationCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#destination_cidr_block Ec2TrafficMirrorFilterRule#destination_cidr_block}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationCidrBlock(java.lang.String destinationCidrBlock) {
            this.destinationCidrBlock = destinationCidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getRuleAction}
         * @param ruleAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_action Ec2TrafficMirrorFilterRule#rule_action}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleAction(java.lang.String ruleAction) {
            this.ruleAction = ruleAction;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getRuleNumber}
         * @param ruleNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#rule_number Ec2TrafficMirrorFilterRule#rule_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleNumber(java.lang.Number ruleNumber) {
            this.ruleNumber = ruleNumber;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getSourceCidrBlock}
         * @param sourceCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#source_cidr_block Ec2TrafficMirrorFilterRule#source_cidr_block}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceCidrBlock(java.lang.String sourceCidrBlock) {
            this.sourceCidrBlock = sourceCidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getTrafficDirection}
         * @param trafficDirection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_direction Ec2TrafficMirrorFilterRule#traffic_direction}. This parameter is required.
         * @return {@code this}
         */
        public Builder trafficDirection(java.lang.String trafficDirection) {
            this.trafficDirection = trafficDirection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getTrafficMirrorFilterId}
         * @param trafficMirrorFilterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#traffic_mirror_filter_id Ec2TrafficMirrorFilterRule#traffic_mirror_filter_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder trafficMirrorFilterId(java.lang.String trafficMirrorFilterId) {
            this.trafficMirrorFilterId = trafficMirrorFilterId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#description Ec2TrafficMirrorFilterRule#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getDestinationPortRange}
         * @param destinationPortRange destination_port_range block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#destination_port_range Ec2TrafficMirrorFilterRule#destination_port_range}
         * @return {@code this}
         */
        public Builder destinationPortRange(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange destinationPortRange) {
            this.destinationPortRange = destinationPortRange;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#id Ec2TrafficMirrorFilterRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#protocol Ec2TrafficMirrorFilterRule#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.Number protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getSourcePortRange}
         * @param sourcePortRange source_port_range block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_filter_rule#source_port_range Ec2TrafficMirrorFilterRule#source_port_range}
         * @return {@code this}
         */
        public Builder sourcePortRange(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange sourcePortRange) {
            this.sourcePortRange = sourcePortRange;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorFilterRuleConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2TrafficMirrorFilterRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2TrafficMirrorFilterRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2TrafficMirrorFilterRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2TrafficMirrorFilterRuleConfig {
        private final java.lang.String destinationCidrBlock;
        private final java.lang.String ruleAction;
        private final java.lang.Number ruleNumber;
        private final java.lang.String sourceCidrBlock;
        private final java.lang.String trafficDirection;
        private final java.lang.String trafficMirrorFilterId;
        private final java.lang.String description;
        private final imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange destinationPortRange;
        private final java.lang.String id;
        private final java.lang.Number protocol;
        private final imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange sourcePortRange;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationCidrBlock = software.amazon.jsii.Kernel.get(this, "destinationCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleAction = software.amazon.jsii.Kernel.get(this, "ruleAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleNumber = software.amazon.jsii.Kernel.get(this, "ruleNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sourceCidrBlock = software.amazon.jsii.Kernel.get(this, "sourceCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trafficDirection = software.amazon.jsii.Kernel.get(this, "trafficDirection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trafficMirrorFilterId = software.amazon.jsii.Kernel.get(this, "trafficMirrorFilterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationPortRange = software.amazon.jsii.Kernel.get(this, "destinationPortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sourcePortRange = software.amazon.jsii.Kernel.get(this, "sourcePortRange", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationCidrBlock = java.util.Objects.requireNonNull(builder.destinationCidrBlock, "destinationCidrBlock is required");
            this.ruleAction = java.util.Objects.requireNonNull(builder.ruleAction, "ruleAction is required");
            this.ruleNumber = java.util.Objects.requireNonNull(builder.ruleNumber, "ruleNumber is required");
            this.sourceCidrBlock = java.util.Objects.requireNonNull(builder.sourceCidrBlock, "sourceCidrBlock is required");
            this.trafficDirection = java.util.Objects.requireNonNull(builder.trafficDirection, "trafficDirection is required");
            this.trafficMirrorFilterId = java.util.Objects.requireNonNull(builder.trafficMirrorFilterId, "trafficMirrorFilterId is required");
            this.description = builder.description;
            this.destinationPortRange = builder.destinationPortRange;
            this.id = builder.id;
            this.protocol = builder.protocol;
            this.sourcePortRange = builder.sourcePortRange;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDestinationCidrBlock() {
            return this.destinationCidrBlock;
        }

        @Override
        public final java.lang.String getRuleAction() {
            return this.ruleAction;
        }

        @Override
        public final java.lang.Number getRuleNumber() {
            return this.ruleNumber;
        }

        @Override
        public final java.lang.String getSourceCidrBlock() {
            return this.sourceCidrBlock;
        }

        @Override
        public final java.lang.String getTrafficDirection() {
            return this.trafficDirection;
        }

        @Override
        public final java.lang.String getTrafficMirrorFilterId() {
            return this.trafficMirrorFilterId;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleDestinationPortRange getDestinationPortRange() {
            return this.destinationPortRange;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getProtocol() {
            return this.protocol;
        }

        @Override
        public final imports.aws.ec2_traffic_mirror_filter_rule.Ec2TrafficMirrorFilterRuleSourcePortRange getSourcePortRange() {
            return this.sourcePortRange;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destinationCidrBlock", om.valueToTree(this.getDestinationCidrBlock()));
            data.set("ruleAction", om.valueToTree(this.getRuleAction()));
            data.set("ruleNumber", om.valueToTree(this.getRuleNumber()));
            data.set("sourceCidrBlock", om.valueToTree(this.getSourceCidrBlock()));
            data.set("trafficDirection", om.valueToTree(this.getTrafficDirection()));
            data.set("trafficMirrorFilterId", om.valueToTree(this.getTrafficMirrorFilterId()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDestinationPortRange() != null) {
                data.set("destinationPortRange", om.valueToTree(this.getDestinationPortRange()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getSourcePortRange() != null) {
                data.set("sourcePortRange", om.valueToTree(this.getSourcePortRange()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2TrafficMirrorFilterRule.Ec2TrafficMirrorFilterRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2TrafficMirrorFilterRuleConfig.Jsii$Proxy that = (Ec2TrafficMirrorFilterRuleConfig.Jsii$Proxy) o;

            if (!destinationCidrBlock.equals(that.destinationCidrBlock)) return false;
            if (!ruleAction.equals(that.ruleAction)) return false;
            if (!ruleNumber.equals(that.ruleNumber)) return false;
            if (!sourceCidrBlock.equals(that.sourceCidrBlock)) return false;
            if (!trafficDirection.equals(that.trafficDirection)) return false;
            if (!trafficMirrorFilterId.equals(that.trafficMirrorFilterId)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.destinationPortRange != null ? !this.destinationPortRange.equals(that.destinationPortRange) : that.destinationPortRange != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.sourcePortRange != null ? !this.sourcePortRange.equals(that.sourcePortRange) : that.sourcePortRange != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destinationCidrBlock.hashCode();
            result = 31 * result + (this.ruleAction.hashCode());
            result = 31 * result + (this.ruleNumber.hashCode());
            result = 31 * result + (this.sourceCidrBlock.hashCode());
            result = 31 * result + (this.trafficDirection.hashCode());
            result = 31 * result + (this.trafficMirrorFilterId.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.destinationPortRange != null ? this.destinationPortRange.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.sourcePortRange != null ? this.sourcePortRange.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
