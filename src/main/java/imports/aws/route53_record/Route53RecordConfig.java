package imports.aws.route53_record;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53Record.Route53RecordConfig")
@software.amazon.jsii.Jsii.Proxy(Route53RecordConfig.Jsii$Proxy.class)
public interface Route53RecordConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#name Route53Record#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#type Route53Record#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#zone_id Route53Record#zone_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getZoneId();

    /**
     * alias block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#alias Route53Record#alias}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordAlias getAlias() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#allow_overwrite Route53Record#allow_overwrite}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowOverwrite() {
        return null;
    }

    /**
     * cidr_routing_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#cidr_routing_policy Route53Record#cidr_routing_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordCidrRoutingPolicy getCidrRoutingPolicy() {
        return null;
    }

    /**
     * failover_routing_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#failover_routing_policy Route53Record#failover_routing_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordFailoverRoutingPolicy getFailoverRoutingPolicy() {
        return null;
    }

    /**
     * geolocation_routing_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#geolocation_routing_policy Route53Record#geolocation_routing_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy getGeolocationRoutingPolicy() {
        return null;
    }

    /**
     * geoproximity_routing_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#geoproximity_routing_policy Route53Record#geoproximity_routing_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy getGeoproximityRoutingPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#health_check_id Route53Record#health_check_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#id Route53Record#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * latency_routing_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#latency_routing_policy Route53Record#latency_routing_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordLatencyRoutingPolicy getLatencyRoutingPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#multivalue_answer_routing_policy Route53Record#multivalue_answer_routing_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultivalueAnswerRoutingPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#records Route53Record#records}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRecords() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#set_identifier Route53Record#set_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSetIdentifier() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#timeouts Route53Record#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#ttl Route53Record#ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTtl() {
        return null;
    }

    /**
     * weighted_routing_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#weighted_routing_policy Route53Record#weighted_routing_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_record.Route53RecordWeightedRoutingPolicy getWeightedRoutingPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53RecordConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53RecordConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53RecordConfig> {
        java.lang.String name;
        java.lang.String type;
        java.lang.String zoneId;
        imports.aws.route53_record.Route53RecordAlias alias;
        java.lang.Object allowOverwrite;
        imports.aws.route53_record.Route53RecordCidrRoutingPolicy cidrRoutingPolicy;
        imports.aws.route53_record.Route53RecordFailoverRoutingPolicy failoverRoutingPolicy;
        imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy geolocationRoutingPolicy;
        imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy geoproximityRoutingPolicy;
        java.lang.String healthCheckId;
        java.lang.String id;
        imports.aws.route53_record.Route53RecordLatencyRoutingPolicy latencyRoutingPolicy;
        java.lang.Object multivalueAnswerRoutingPolicy;
        java.util.List<java.lang.String> records;
        java.lang.String setIdentifier;
        imports.aws.route53_record.Route53RecordTimeouts timeouts;
        java.lang.Number ttl;
        imports.aws.route53_record.Route53RecordWeightedRoutingPolicy weightedRoutingPolicy;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Route53RecordConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#name Route53Record#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#type Route53Record#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getZoneId}
         * @param zoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#zone_id Route53Record#zone_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder zoneId(java.lang.String zoneId) {
            this.zoneId = zoneId;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getAlias}
         * @param alias alias block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#alias Route53Record#alias}
         * @return {@code this}
         */
        public Builder alias(imports.aws.route53_record.Route53RecordAlias alias) {
            this.alias = alias;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getAllowOverwrite}
         * @param allowOverwrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#allow_overwrite Route53Record#allow_overwrite}.
         * @return {@code this}
         */
        public Builder allowOverwrite(java.lang.Boolean allowOverwrite) {
            this.allowOverwrite = allowOverwrite;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getAllowOverwrite}
         * @param allowOverwrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#allow_overwrite Route53Record#allow_overwrite}.
         * @return {@code this}
         */
        public Builder allowOverwrite(com.hashicorp.cdktf.IResolvable allowOverwrite) {
            this.allowOverwrite = allowOverwrite;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getCidrRoutingPolicy}
         * @param cidrRoutingPolicy cidr_routing_policy block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#cidr_routing_policy Route53Record#cidr_routing_policy}
         * @return {@code this}
         */
        public Builder cidrRoutingPolicy(imports.aws.route53_record.Route53RecordCidrRoutingPolicy cidrRoutingPolicy) {
            this.cidrRoutingPolicy = cidrRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getFailoverRoutingPolicy}
         * @param failoverRoutingPolicy failover_routing_policy block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#failover_routing_policy Route53Record#failover_routing_policy}
         * @return {@code this}
         */
        public Builder failoverRoutingPolicy(imports.aws.route53_record.Route53RecordFailoverRoutingPolicy failoverRoutingPolicy) {
            this.failoverRoutingPolicy = failoverRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getGeolocationRoutingPolicy}
         * @param geolocationRoutingPolicy geolocation_routing_policy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#geolocation_routing_policy Route53Record#geolocation_routing_policy}
         * @return {@code this}
         */
        public Builder geolocationRoutingPolicy(imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy geolocationRoutingPolicy) {
            this.geolocationRoutingPolicy = geolocationRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getGeoproximityRoutingPolicy}
         * @param geoproximityRoutingPolicy geoproximity_routing_policy block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#geoproximity_routing_policy Route53Record#geoproximity_routing_policy}
         * @return {@code this}
         */
        public Builder geoproximityRoutingPolicy(imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy geoproximityRoutingPolicy) {
            this.geoproximityRoutingPolicy = geoproximityRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getHealthCheckId}
         * @param healthCheckId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#health_check_id Route53Record#health_check_id}.
         * @return {@code this}
         */
        public Builder healthCheckId(java.lang.String healthCheckId) {
            this.healthCheckId = healthCheckId;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#id Route53Record#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getLatencyRoutingPolicy}
         * @param latencyRoutingPolicy latency_routing_policy block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#latency_routing_policy Route53Record#latency_routing_policy}
         * @return {@code this}
         */
        public Builder latencyRoutingPolicy(imports.aws.route53_record.Route53RecordLatencyRoutingPolicy latencyRoutingPolicy) {
            this.latencyRoutingPolicy = latencyRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getMultivalueAnswerRoutingPolicy}
         * @param multivalueAnswerRoutingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#multivalue_answer_routing_policy Route53Record#multivalue_answer_routing_policy}.
         * @return {@code this}
         */
        public Builder multivalueAnswerRoutingPolicy(java.lang.Boolean multivalueAnswerRoutingPolicy) {
            this.multivalueAnswerRoutingPolicy = multivalueAnswerRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getMultivalueAnswerRoutingPolicy}
         * @param multivalueAnswerRoutingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#multivalue_answer_routing_policy Route53Record#multivalue_answer_routing_policy}.
         * @return {@code this}
         */
        public Builder multivalueAnswerRoutingPolicy(com.hashicorp.cdktf.IResolvable multivalueAnswerRoutingPolicy) {
            this.multivalueAnswerRoutingPolicy = multivalueAnswerRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getRecords}
         * @param records Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#records Route53Record#records}.
         * @return {@code this}
         */
        public Builder records(java.util.List<java.lang.String> records) {
            this.records = records;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getSetIdentifier}
         * @param setIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#set_identifier Route53Record#set_identifier}.
         * @return {@code this}
         */
        public Builder setIdentifier(java.lang.String setIdentifier) {
            this.setIdentifier = setIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#timeouts Route53Record#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.route53_record.Route53RecordTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getTtl}
         * @param ttl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#ttl Route53Record#ttl}.
         * @return {@code this}
         */
        public Builder ttl(java.lang.Number ttl) {
            this.ttl = ttl;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getWeightedRoutingPolicy}
         * @param weightedRoutingPolicy weighted_routing_policy block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_record#weighted_routing_policy Route53Record#weighted_routing_policy}
         * @return {@code this}
         */
        public Builder weightedRoutingPolicy(imports.aws.route53_record.Route53RecordWeightedRoutingPolicy weightedRoutingPolicy) {
            this.weightedRoutingPolicy = weightedRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getDependsOn}
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
         * Sets the value of {@link Route53RecordConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Route53RecordConfig#getProvisioners}
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
         * @return a new instance of {@link Route53RecordConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53RecordConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53RecordConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53RecordConfig {
        private final java.lang.String name;
        private final java.lang.String type;
        private final java.lang.String zoneId;
        private final imports.aws.route53_record.Route53RecordAlias alias;
        private final java.lang.Object allowOverwrite;
        private final imports.aws.route53_record.Route53RecordCidrRoutingPolicy cidrRoutingPolicy;
        private final imports.aws.route53_record.Route53RecordFailoverRoutingPolicy failoverRoutingPolicy;
        private final imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy geolocationRoutingPolicy;
        private final imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy geoproximityRoutingPolicy;
        private final java.lang.String healthCheckId;
        private final java.lang.String id;
        private final imports.aws.route53_record.Route53RecordLatencyRoutingPolicy latencyRoutingPolicy;
        private final java.lang.Object multivalueAnswerRoutingPolicy;
        private final java.util.List<java.lang.String> records;
        private final java.lang.String setIdentifier;
        private final imports.aws.route53_record.Route53RecordTimeouts timeouts;
        private final java.lang.Number ttl;
        private final imports.aws.route53_record.Route53RecordWeightedRoutingPolicy weightedRoutingPolicy;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.zoneId = software.amazon.jsii.Kernel.get(this, "zoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alias = software.amazon.jsii.Kernel.get(this, "alias", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordAlias.class));
            this.allowOverwrite = software.amazon.jsii.Kernel.get(this, "allowOverwrite", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cidrRoutingPolicy = software.amazon.jsii.Kernel.get(this, "cidrRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordCidrRoutingPolicy.class));
            this.failoverRoutingPolicy = software.amazon.jsii.Kernel.get(this, "failoverRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordFailoverRoutingPolicy.class));
            this.geolocationRoutingPolicy = software.amazon.jsii.Kernel.get(this, "geolocationRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy.class));
            this.geoproximityRoutingPolicy = software.amazon.jsii.Kernel.get(this, "geoproximityRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy.class));
            this.healthCheckId = software.amazon.jsii.Kernel.get(this, "healthCheckId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.latencyRoutingPolicy = software.amazon.jsii.Kernel.get(this, "latencyRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordLatencyRoutingPolicy.class));
            this.multivalueAnswerRoutingPolicy = software.amazon.jsii.Kernel.get(this, "multivalueAnswerRoutingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.records = software.amazon.jsii.Kernel.get(this, "records", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.setIdentifier = software.amazon.jsii.Kernel.get(this, "setIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordTimeouts.class));
            this.ttl = software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.weightedRoutingPolicy = software.amazon.jsii.Kernel.get(this, "weightedRoutingPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.route53_record.Route53RecordWeightedRoutingPolicy.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.zoneId = java.util.Objects.requireNonNull(builder.zoneId, "zoneId is required");
            this.alias = builder.alias;
            this.allowOverwrite = builder.allowOverwrite;
            this.cidrRoutingPolicy = builder.cidrRoutingPolicy;
            this.failoverRoutingPolicy = builder.failoverRoutingPolicy;
            this.geolocationRoutingPolicy = builder.geolocationRoutingPolicy;
            this.geoproximityRoutingPolicy = builder.geoproximityRoutingPolicy;
            this.healthCheckId = builder.healthCheckId;
            this.id = builder.id;
            this.latencyRoutingPolicy = builder.latencyRoutingPolicy;
            this.multivalueAnswerRoutingPolicy = builder.multivalueAnswerRoutingPolicy;
            this.records = builder.records;
            this.setIdentifier = builder.setIdentifier;
            this.timeouts = builder.timeouts;
            this.ttl = builder.ttl;
            this.weightedRoutingPolicy = builder.weightedRoutingPolicy;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getZoneId() {
            return this.zoneId;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordAlias getAlias() {
            return this.alias;
        }

        @Override
        public final java.lang.Object getAllowOverwrite() {
            return this.allowOverwrite;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordCidrRoutingPolicy getCidrRoutingPolicy() {
            return this.cidrRoutingPolicy;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordFailoverRoutingPolicy getFailoverRoutingPolicy() {
            return this.failoverRoutingPolicy;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordGeolocationRoutingPolicy getGeolocationRoutingPolicy() {
            return this.geolocationRoutingPolicy;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordGeoproximityRoutingPolicy getGeoproximityRoutingPolicy() {
            return this.geoproximityRoutingPolicy;
        }

        @Override
        public final java.lang.String getHealthCheckId() {
            return this.healthCheckId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordLatencyRoutingPolicy getLatencyRoutingPolicy() {
            return this.latencyRoutingPolicy;
        }

        @Override
        public final java.lang.Object getMultivalueAnswerRoutingPolicy() {
            return this.multivalueAnswerRoutingPolicy;
        }

        @Override
        public final java.util.List<java.lang.String> getRecords() {
            return this.records;
        }

        @Override
        public final java.lang.String getSetIdentifier() {
            return this.setIdentifier;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Number getTtl() {
            return this.ttl;
        }

        @Override
        public final imports.aws.route53_record.Route53RecordWeightedRoutingPolicy getWeightedRoutingPolicy() {
            return this.weightedRoutingPolicy;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("type", om.valueToTree(this.getType()));
            data.set("zoneId", om.valueToTree(this.getZoneId()));
            if (this.getAlias() != null) {
                data.set("alias", om.valueToTree(this.getAlias()));
            }
            if (this.getAllowOverwrite() != null) {
                data.set("allowOverwrite", om.valueToTree(this.getAllowOverwrite()));
            }
            if (this.getCidrRoutingPolicy() != null) {
                data.set("cidrRoutingPolicy", om.valueToTree(this.getCidrRoutingPolicy()));
            }
            if (this.getFailoverRoutingPolicy() != null) {
                data.set("failoverRoutingPolicy", om.valueToTree(this.getFailoverRoutingPolicy()));
            }
            if (this.getGeolocationRoutingPolicy() != null) {
                data.set("geolocationRoutingPolicy", om.valueToTree(this.getGeolocationRoutingPolicy()));
            }
            if (this.getGeoproximityRoutingPolicy() != null) {
                data.set("geoproximityRoutingPolicy", om.valueToTree(this.getGeoproximityRoutingPolicy()));
            }
            if (this.getHealthCheckId() != null) {
                data.set("healthCheckId", om.valueToTree(this.getHealthCheckId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLatencyRoutingPolicy() != null) {
                data.set("latencyRoutingPolicy", om.valueToTree(this.getLatencyRoutingPolicy()));
            }
            if (this.getMultivalueAnswerRoutingPolicy() != null) {
                data.set("multivalueAnswerRoutingPolicy", om.valueToTree(this.getMultivalueAnswerRoutingPolicy()));
            }
            if (this.getRecords() != null) {
                data.set("records", om.valueToTree(this.getRecords()));
            }
            if (this.getSetIdentifier() != null) {
                data.set("setIdentifier", om.valueToTree(this.getSetIdentifier()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTtl() != null) {
                data.set("ttl", om.valueToTree(this.getTtl()));
            }
            if (this.getWeightedRoutingPolicy() != null) {
                data.set("weightedRoutingPolicy", om.valueToTree(this.getWeightedRoutingPolicy()));
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
            struct.set("fqn", om.valueToTree("aws.route53Record.Route53RecordConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53RecordConfig.Jsii$Proxy that = (Route53RecordConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!type.equals(that.type)) return false;
            if (!zoneId.equals(that.zoneId)) return false;
            if (this.alias != null ? !this.alias.equals(that.alias) : that.alias != null) return false;
            if (this.allowOverwrite != null ? !this.allowOverwrite.equals(that.allowOverwrite) : that.allowOverwrite != null) return false;
            if (this.cidrRoutingPolicy != null ? !this.cidrRoutingPolicy.equals(that.cidrRoutingPolicy) : that.cidrRoutingPolicy != null) return false;
            if (this.failoverRoutingPolicy != null ? !this.failoverRoutingPolicy.equals(that.failoverRoutingPolicy) : that.failoverRoutingPolicy != null) return false;
            if (this.geolocationRoutingPolicy != null ? !this.geolocationRoutingPolicy.equals(that.geolocationRoutingPolicy) : that.geolocationRoutingPolicy != null) return false;
            if (this.geoproximityRoutingPolicy != null ? !this.geoproximityRoutingPolicy.equals(that.geoproximityRoutingPolicy) : that.geoproximityRoutingPolicy != null) return false;
            if (this.healthCheckId != null ? !this.healthCheckId.equals(that.healthCheckId) : that.healthCheckId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.latencyRoutingPolicy != null ? !this.latencyRoutingPolicy.equals(that.latencyRoutingPolicy) : that.latencyRoutingPolicy != null) return false;
            if (this.multivalueAnswerRoutingPolicy != null ? !this.multivalueAnswerRoutingPolicy.equals(that.multivalueAnswerRoutingPolicy) : that.multivalueAnswerRoutingPolicy != null) return false;
            if (this.records != null ? !this.records.equals(that.records) : that.records != null) return false;
            if (this.setIdentifier != null ? !this.setIdentifier.equals(that.setIdentifier) : that.setIdentifier != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.ttl != null ? !this.ttl.equals(that.ttl) : that.ttl != null) return false;
            if (this.weightedRoutingPolicy != null ? !this.weightedRoutingPolicy.equals(that.weightedRoutingPolicy) : that.weightedRoutingPolicy != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.zoneId.hashCode());
            result = 31 * result + (this.alias != null ? this.alias.hashCode() : 0);
            result = 31 * result + (this.allowOverwrite != null ? this.allowOverwrite.hashCode() : 0);
            result = 31 * result + (this.cidrRoutingPolicy != null ? this.cidrRoutingPolicy.hashCode() : 0);
            result = 31 * result + (this.failoverRoutingPolicy != null ? this.failoverRoutingPolicy.hashCode() : 0);
            result = 31 * result + (this.geolocationRoutingPolicy != null ? this.geolocationRoutingPolicy.hashCode() : 0);
            result = 31 * result + (this.geoproximityRoutingPolicy != null ? this.geoproximityRoutingPolicy.hashCode() : 0);
            result = 31 * result + (this.healthCheckId != null ? this.healthCheckId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.latencyRoutingPolicy != null ? this.latencyRoutingPolicy.hashCode() : 0);
            result = 31 * result + (this.multivalueAnswerRoutingPolicy != null ? this.multivalueAnswerRoutingPolicy.hashCode() : 0);
            result = 31 * result + (this.records != null ? this.records.hashCode() : 0);
            result = 31 * result + (this.setIdentifier != null ? this.setIdentifier.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.ttl != null ? this.ttl.hashCode() : 0);
            result = 31 * result + (this.weightedRoutingPolicy != null ? this.weightedRoutingPolicy.hashCode() : 0);
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
