package imports.aws.route53_records_exclusive;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSet")
@software.amazon.jsii.Jsii.Proxy(Route53RecordsExclusiveResourceRecordSet.Jsii$Proxy.class)
public interface Route53RecordsExclusiveResourceRecordSet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#name Route53RecordsExclusive#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * alias_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#alias_target Route53RecordsExclusive#alias_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAliasTarget() {
        return null;
    }

    /**
     * cidr_routing_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#cidr_routing_config Route53RecordsExclusive#cidr_routing_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCidrRoutingConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#failover Route53RecordsExclusive#failover}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFailover() {
        return null;
    }

    /**
     * geolocation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geolocation Route53RecordsExclusive#geolocation}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGeolocation() {
        return null;
    }

    /**
     * geoproximity_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geoproximity_location Route53RecordsExclusive#geoproximity_location}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGeoproximityLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#health_check_id Route53RecordsExclusive#health_check_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#multi_value_answer Route53RecordsExclusive#multi_value_answer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiValueAnswer() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#region Route53RecordsExclusive#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * resource_records block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_records Route53RecordsExclusive#resource_records}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResourceRecords() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#set_identifier Route53RecordsExclusive#set_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSetIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#traffic_policy_instance_id Route53RecordsExclusive#traffic_policy_instance_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTrafficPolicyInstanceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#ttl Route53RecordsExclusive#ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTtl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#type Route53RecordsExclusive#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#weight Route53RecordsExclusive#weight}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeight() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecordsExclusiveResourceRecordSet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecordsExclusiveResourceRecordSet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecordsExclusiveResourceRecordSet> {
        java.lang.String name;
        java.lang.Object aliasTarget;
        java.lang.Object cidrRoutingConfig;
        java.lang.String failover;
        java.lang.Object geolocation;
        java.lang.Object geoproximityLocation;
        java.lang.String healthCheckId;
        java.lang.Object multiValueAnswer;
        java.lang.String region;
        java.lang.Object resourceRecords;
        java.lang.String setIdentifier;
        java.lang.String trafficPolicyInstanceId;
        java.lang.Number ttl;
        java.lang.String type;
        java.lang.Number weight;

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#name Route53RecordsExclusive#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getAliasTarget}
         * @param aliasTarget alias_target block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#alias_target Route53RecordsExclusive#alias_target}
         * @return {@code this}
         */
        public Builder aliasTarget(com.hashicorp.cdktf.IResolvable aliasTarget) {
            this.aliasTarget = aliasTarget;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getAliasTarget}
         * @param aliasTarget alias_target block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#alias_target Route53RecordsExclusive#alias_target}
         * @return {@code this}
         */
        public Builder aliasTarget(java.util.List<? extends imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetAliasTarget> aliasTarget) {
            this.aliasTarget = aliasTarget;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getCidrRoutingConfig}
         * @param cidrRoutingConfig cidr_routing_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#cidr_routing_config Route53RecordsExclusive#cidr_routing_config}
         * @return {@code this}
         */
        public Builder cidrRoutingConfig(com.hashicorp.cdktf.IResolvable cidrRoutingConfig) {
            this.cidrRoutingConfig = cidrRoutingConfig;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getCidrRoutingConfig}
         * @param cidrRoutingConfig cidr_routing_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#cidr_routing_config Route53RecordsExclusive#cidr_routing_config}
         * @return {@code this}
         */
        public Builder cidrRoutingConfig(java.util.List<? extends imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetCidrRoutingConfig> cidrRoutingConfig) {
            this.cidrRoutingConfig = cidrRoutingConfig;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getFailover}
         * @param failover Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#failover Route53RecordsExclusive#failover}.
         * @return {@code this}
         */
        public Builder failover(java.lang.String failover) {
            this.failover = failover;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getGeolocation}
         * @param geolocation geolocation block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geolocation Route53RecordsExclusive#geolocation}
         * @return {@code this}
         */
        public Builder geolocation(com.hashicorp.cdktf.IResolvable geolocation) {
            this.geolocation = geolocation;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getGeolocation}
         * @param geolocation geolocation block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geolocation Route53RecordsExclusive#geolocation}
         * @return {@code this}
         */
        public Builder geolocation(java.util.List<? extends imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeolocation> geolocation) {
            this.geolocation = geolocation;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getGeoproximityLocation}
         * @param geoproximityLocation geoproximity_location block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geoproximity_location Route53RecordsExclusive#geoproximity_location}
         * @return {@code this}
         */
        public Builder geoproximityLocation(com.hashicorp.cdktf.IResolvable geoproximityLocation) {
            this.geoproximityLocation = geoproximityLocation;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getGeoproximityLocation}
         * @param geoproximityLocation geoproximity_location block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#geoproximity_location Route53RecordsExclusive#geoproximity_location}
         * @return {@code this}
         */
        public Builder geoproximityLocation(java.util.List<? extends imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetGeoproximityLocation> geoproximityLocation) {
            this.geoproximityLocation = geoproximityLocation;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getHealthCheckId}
         * @param healthCheckId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#health_check_id Route53RecordsExclusive#health_check_id}.
         * @return {@code this}
         */
        public Builder healthCheckId(java.lang.String healthCheckId) {
            this.healthCheckId = healthCheckId;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getMultiValueAnswer}
         * @param multiValueAnswer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#multi_value_answer Route53RecordsExclusive#multi_value_answer}.
         * @return {@code this}
         */
        public Builder multiValueAnswer(java.lang.Boolean multiValueAnswer) {
            this.multiValueAnswer = multiValueAnswer;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getMultiValueAnswer}
         * @param multiValueAnswer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#multi_value_answer Route53RecordsExclusive#multi_value_answer}.
         * @return {@code this}
         */
        public Builder multiValueAnswer(com.hashicorp.cdktf.IResolvable multiValueAnswer) {
            this.multiValueAnswer = multiValueAnswer;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#region Route53RecordsExclusive#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getResourceRecords}
         * @param resourceRecords resource_records block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_records Route53RecordsExclusive#resource_records}
         * @return {@code this}
         */
        public Builder resourceRecords(com.hashicorp.cdktf.IResolvable resourceRecords) {
            this.resourceRecords = resourceRecords;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getResourceRecords}
         * @param resourceRecords resource_records block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#resource_records Route53RecordsExclusive#resource_records}
         * @return {@code this}
         */
        public Builder resourceRecords(java.util.List<? extends imports.aws.route53_records_exclusive.Route53RecordsExclusiveResourceRecordSetResourceRecords> resourceRecords) {
            this.resourceRecords = resourceRecords;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getSetIdentifier}
         * @param setIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#set_identifier Route53RecordsExclusive#set_identifier}.
         * @return {@code this}
         */
        public Builder setIdentifier(java.lang.String setIdentifier) {
            this.setIdentifier = setIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getTrafficPolicyInstanceId}
         * @param trafficPolicyInstanceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#traffic_policy_instance_id Route53RecordsExclusive#traffic_policy_instance_id}.
         * @return {@code this}
         */
        public Builder trafficPolicyInstanceId(java.lang.String trafficPolicyInstanceId) {
            this.trafficPolicyInstanceId = trafficPolicyInstanceId;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getTtl}
         * @param ttl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#ttl Route53RecordsExclusive#ttl}.
         * @return {@code this}
         */
        public Builder ttl(java.lang.Number ttl) {
            this.ttl = ttl;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#type Route53RecordsExclusive#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordsExclusiveResourceRecordSet#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_records_exclusive#weight Route53RecordsExclusive#weight}.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53RecordsExclusiveResourceRecordSet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecordsExclusiveResourceRecordSet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecordsExclusiveResourceRecordSet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecordsExclusiveResourceRecordSet {
        private final java.lang.String name;
        private final java.lang.Object aliasTarget;
        private final java.lang.Object cidrRoutingConfig;
        private final java.lang.String failover;
        private final java.lang.Object geolocation;
        private final java.lang.Object geoproximityLocation;
        private final java.lang.String healthCheckId;
        private final java.lang.Object multiValueAnswer;
        private final java.lang.String region;
        private final java.lang.Object resourceRecords;
        private final java.lang.String setIdentifier;
        private final java.lang.String trafficPolicyInstanceId;
        private final java.lang.Number ttl;
        private final java.lang.String type;
        private final java.lang.Number weight;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.aliasTarget = software.amazon.jsii.Kernel.get(this, "aliasTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cidrRoutingConfig = software.amazon.jsii.Kernel.get(this, "cidrRoutingConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failover = software.amazon.jsii.Kernel.get(this, "failover", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.geolocation = software.amazon.jsii.Kernel.get(this, "geolocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.geoproximityLocation = software.amazon.jsii.Kernel.get(this, "geoproximityLocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.healthCheckId = software.amazon.jsii.Kernel.get(this, "healthCheckId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiValueAnswer = software.amazon.jsii.Kernel.get(this, "multiValueAnswer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceRecords = software.amazon.jsii.Kernel.get(this, "resourceRecords", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.setIdentifier = software.amazon.jsii.Kernel.get(this, "setIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trafficPolicyInstanceId = software.amazon.jsii.Kernel.get(this, "trafficPolicyInstanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ttl = software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.aliasTarget = builder.aliasTarget;
            this.cidrRoutingConfig = builder.cidrRoutingConfig;
            this.failover = builder.failover;
            this.geolocation = builder.geolocation;
            this.geoproximityLocation = builder.geoproximityLocation;
            this.healthCheckId = builder.healthCheckId;
            this.multiValueAnswer = builder.multiValueAnswer;
            this.region = builder.region;
            this.resourceRecords = builder.resourceRecords;
            this.setIdentifier = builder.setIdentifier;
            this.trafficPolicyInstanceId = builder.trafficPolicyInstanceId;
            this.ttl = builder.ttl;
            this.type = builder.type;
            this.weight = builder.weight;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getAliasTarget() {
            return this.aliasTarget;
        }

        @Override
        public final java.lang.Object getCidrRoutingConfig() {
            return this.cidrRoutingConfig;
        }

        @Override
        public final java.lang.String getFailover() {
            return this.failover;
        }

        @Override
        public final java.lang.Object getGeolocation() {
            return this.geolocation;
        }

        @Override
        public final java.lang.Object getGeoproximityLocation() {
            return this.geoproximityLocation;
        }

        @Override
        public final java.lang.String getHealthCheckId() {
            return this.healthCheckId;
        }

        @Override
        public final java.lang.Object getMultiValueAnswer() {
            return this.multiValueAnswer;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.Object getResourceRecords() {
            return this.resourceRecords;
        }

        @Override
        public final java.lang.String getSetIdentifier() {
            return this.setIdentifier;
        }

        @Override
        public final java.lang.String getTrafficPolicyInstanceId() {
            return this.trafficPolicyInstanceId;
        }

        @Override
        public final java.lang.Number getTtl() {
            return this.ttl;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAliasTarget() != null) {
                data.set("aliasTarget", om.valueToTree(this.getAliasTarget()));
            }
            if (this.getCidrRoutingConfig() != null) {
                data.set("cidrRoutingConfig", om.valueToTree(this.getCidrRoutingConfig()));
            }
            if (this.getFailover() != null) {
                data.set("failover", om.valueToTree(this.getFailover()));
            }
            if (this.getGeolocation() != null) {
                data.set("geolocation", om.valueToTree(this.getGeolocation()));
            }
            if (this.getGeoproximityLocation() != null) {
                data.set("geoproximityLocation", om.valueToTree(this.getGeoproximityLocation()));
            }
            if (this.getHealthCheckId() != null) {
                data.set("healthCheckId", om.valueToTree(this.getHealthCheckId()));
            }
            if (this.getMultiValueAnswer() != null) {
                data.set("multiValueAnswer", om.valueToTree(this.getMultiValueAnswer()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getResourceRecords() != null) {
                data.set("resourceRecords", om.valueToTree(this.getResourceRecords()));
            }
            if (this.getSetIdentifier() != null) {
                data.set("setIdentifier", om.valueToTree(this.getSetIdentifier()));
            }
            if (this.getTrafficPolicyInstanceId() != null) {
                data.set("trafficPolicyInstanceId", om.valueToTree(this.getTrafficPolicyInstanceId()));
            }
            if (this.getTtl() != null) {
                data.set("ttl", om.valueToTree(this.getTtl()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getWeight() != null) {
                data.set("weight", om.valueToTree(this.getWeight()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53RecordsExclusive.Route53RecordsExclusiveResourceRecordSet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecordsExclusiveResourceRecordSet.Jsii$Proxy that = (Route53RecordsExclusiveResourceRecordSet.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.aliasTarget != null ? !this.aliasTarget.equals(that.aliasTarget) : that.aliasTarget != null) return false;
            if (this.cidrRoutingConfig != null ? !this.cidrRoutingConfig.equals(that.cidrRoutingConfig) : that.cidrRoutingConfig != null) return false;
            if (this.failover != null ? !this.failover.equals(that.failover) : that.failover != null) return false;
            if (this.geolocation != null ? !this.geolocation.equals(that.geolocation) : that.geolocation != null) return false;
            if (this.geoproximityLocation != null ? !this.geoproximityLocation.equals(that.geoproximityLocation) : that.geoproximityLocation != null) return false;
            if (this.healthCheckId != null ? !this.healthCheckId.equals(that.healthCheckId) : that.healthCheckId != null) return false;
            if (this.multiValueAnswer != null ? !this.multiValueAnswer.equals(that.multiValueAnswer) : that.multiValueAnswer != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.resourceRecords != null ? !this.resourceRecords.equals(that.resourceRecords) : that.resourceRecords != null) return false;
            if (this.setIdentifier != null ? !this.setIdentifier.equals(that.setIdentifier) : that.setIdentifier != null) return false;
            if (this.trafficPolicyInstanceId != null ? !this.trafficPolicyInstanceId.equals(that.trafficPolicyInstanceId) : that.trafficPolicyInstanceId != null) return false;
            if (this.ttl != null ? !this.ttl.equals(that.ttl) : that.ttl != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            return this.weight != null ? this.weight.equals(that.weight) : that.weight == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.aliasTarget != null ? this.aliasTarget.hashCode() : 0);
            result = 31 * result + (this.cidrRoutingConfig != null ? this.cidrRoutingConfig.hashCode() : 0);
            result = 31 * result + (this.failover != null ? this.failover.hashCode() : 0);
            result = 31 * result + (this.geolocation != null ? this.geolocation.hashCode() : 0);
            result = 31 * result + (this.geoproximityLocation != null ? this.geoproximityLocation.hashCode() : 0);
            result = 31 * result + (this.healthCheckId != null ? this.healthCheckId.hashCode() : 0);
            result = 31 * result + (this.multiValueAnswer != null ? this.multiValueAnswer.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.resourceRecords != null ? this.resourceRecords.hashCode() : 0);
            result = 31 * result + (this.setIdentifier != null ? this.setIdentifier.hashCode() : 0);
            result = 31 * result + (this.trafficPolicyInstanceId != null ? this.trafficPolicyInstanceId.hashCode() : 0);
            result = 31 * result + (this.ttl != null ? this.ttl.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.weight != null ? this.weight.hashCode() : 0);
            return result;
        }
    }
}
