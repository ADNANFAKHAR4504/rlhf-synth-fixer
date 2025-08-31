package imports.aws.sns_topic_subscription;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.477Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsTopicSubscription.SnsTopicSubscriptionConfig")
@software.amazon.jsii.Jsii.Proxy(SnsTopicSubscriptionConfig.Jsii$Proxy.class)
public interface SnsTopicSubscriptionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint SnsTopicSubscription#endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#protocol SnsTopicSubscription#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#topic_arn SnsTopicSubscription#topic_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#confirmation_timeout_in_minutes SnsTopicSubscription#confirmation_timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConfirmationTimeoutInMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#delivery_policy SnsTopicSubscription#delivery_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliveryPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint_auto_confirms SnsTopicSubscription#endpoint_auto_confirms}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEndpointAutoConfirms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy SnsTopicSubscription#filter_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilterPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy_scope SnsTopicSubscription#filter_policy_scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilterPolicyScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#id SnsTopicSubscription#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#raw_message_delivery SnsTopicSubscription#raw_message_delivery}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRawMessageDelivery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#redrive_policy SnsTopicSubscription#redrive_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRedrivePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#replay_policy SnsTopicSubscription#replay_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplayPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#subscription_role_arn SnsTopicSubscription#subscription_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubscriptionRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SnsTopicSubscriptionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SnsTopicSubscriptionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SnsTopicSubscriptionConfig> {
        java.lang.String endpoint;
        java.lang.String protocol;
        java.lang.String topicArn;
        java.lang.Number confirmationTimeoutInMinutes;
        java.lang.String deliveryPolicy;
        java.lang.Object endpointAutoConfirms;
        java.lang.String filterPolicy;
        java.lang.String filterPolicyScope;
        java.lang.String id;
        java.lang.Object rawMessageDelivery;
        java.lang.String redrivePolicy;
        java.lang.String replayPolicy;
        java.lang.String subscriptionRoleArn;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getEndpoint}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint SnsTopicSubscription#endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpoint(java.lang.String endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#protocol SnsTopicSubscription#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#topic_arn SnsTopicSubscription#topic_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getConfirmationTimeoutInMinutes}
         * @param confirmationTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#confirmation_timeout_in_minutes SnsTopicSubscription#confirmation_timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder confirmationTimeoutInMinutes(java.lang.Number confirmationTimeoutInMinutes) {
            this.confirmationTimeoutInMinutes = confirmationTimeoutInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getDeliveryPolicy}
         * @param deliveryPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#delivery_policy SnsTopicSubscription#delivery_policy}.
         * @return {@code this}
         */
        public Builder deliveryPolicy(java.lang.String deliveryPolicy) {
            this.deliveryPolicy = deliveryPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getEndpointAutoConfirms}
         * @param endpointAutoConfirms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint_auto_confirms SnsTopicSubscription#endpoint_auto_confirms}.
         * @return {@code this}
         */
        public Builder endpointAutoConfirms(java.lang.Boolean endpointAutoConfirms) {
            this.endpointAutoConfirms = endpointAutoConfirms;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getEndpointAutoConfirms}
         * @param endpointAutoConfirms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint_auto_confirms SnsTopicSubscription#endpoint_auto_confirms}.
         * @return {@code this}
         */
        public Builder endpointAutoConfirms(com.hashicorp.cdktf.IResolvable endpointAutoConfirms) {
            this.endpointAutoConfirms = endpointAutoConfirms;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getFilterPolicy}
         * @param filterPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy SnsTopicSubscription#filter_policy}.
         * @return {@code this}
         */
        public Builder filterPolicy(java.lang.String filterPolicy) {
            this.filterPolicy = filterPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getFilterPolicyScope}
         * @param filterPolicyScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy_scope SnsTopicSubscription#filter_policy_scope}.
         * @return {@code this}
         */
        public Builder filterPolicyScope(java.lang.String filterPolicyScope) {
            this.filterPolicyScope = filterPolicyScope;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#id SnsTopicSubscription#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getRawMessageDelivery}
         * @param rawMessageDelivery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#raw_message_delivery SnsTopicSubscription#raw_message_delivery}.
         * @return {@code this}
         */
        public Builder rawMessageDelivery(java.lang.Boolean rawMessageDelivery) {
            this.rawMessageDelivery = rawMessageDelivery;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getRawMessageDelivery}
         * @param rawMessageDelivery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#raw_message_delivery SnsTopicSubscription#raw_message_delivery}.
         * @return {@code this}
         */
        public Builder rawMessageDelivery(com.hashicorp.cdktf.IResolvable rawMessageDelivery) {
            this.rawMessageDelivery = rawMessageDelivery;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getRedrivePolicy}
         * @param redrivePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#redrive_policy SnsTopicSubscription#redrive_policy}.
         * @return {@code this}
         */
        public Builder redrivePolicy(java.lang.String redrivePolicy) {
            this.redrivePolicy = redrivePolicy;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getReplayPolicy}
         * @param replayPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#replay_policy SnsTopicSubscription#replay_policy}.
         * @return {@code this}
         */
        public Builder replayPolicy(java.lang.String replayPolicy) {
            this.replayPolicy = replayPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getSubscriptionRoleArn}
         * @param subscriptionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#subscription_role_arn SnsTopicSubscription#subscription_role_arn}.
         * @return {@code this}
         */
        public Builder subscriptionRoleArn(java.lang.String subscriptionRoleArn) {
            this.subscriptionRoleArn = subscriptionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getDependsOn}
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
         * Sets the value of {@link SnsTopicSubscriptionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicSubscriptionConfig#getProvisioners}
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
         * @return a new instance of {@link SnsTopicSubscriptionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SnsTopicSubscriptionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SnsTopicSubscriptionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SnsTopicSubscriptionConfig {
        private final java.lang.String endpoint;
        private final java.lang.String protocol;
        private final java.lang.String topicArn;
        private final java.lang.Number confirmationTimeoutInMinutes;
        private final java.lang.String deliveryPolicy;
        private final java.lang.Object endpointAutoConfirms;
        private final java.lang.String filterPolicy;
        private final java.lang.String filterPolicyScope;
        private final java.lang.String id;
        private final java.lang.Object rawMessageDelivery;
        private final java.lang.String redrivePolicy;
        private final java.lang.String replayPolicy;
        private final java.lang.String subscriptionRoleArn;
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
            this.endpoint = software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.confirmationTimeoutInMinutes = software.amazon.jsii.Kernel.get(this, "confirmationTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.deliveryPolicy = software.amazon.jsii.Kernel.get(this, "deliveryPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointAutoConfirms = software.amazon.jsii.Kernel.get(this, "endpointAutoConfirms", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filterPolicy = software.amazon.jsii.Kernel.get(this, "filterPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filterPolicyScope = software.amazon.jsii.Kernel.get(this, "filterPolicyScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rawMessageDelivery = software.amazon.jsii.Kernel.get(this, "rawMessageDelivery", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.redrivePolicy = software.amazon.jsii.Kernel.get(this, "redrivePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replayPolicy = software.amazon.jsii.Kernel.get(this, "replayPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subscriptionRoleArn = software.amazon.jsii.Kernel.get(this, "subscriptionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.endpoint = java.util.Objects.requireNonNull(builder.endpoint, "endpoint is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.topicArn = java.util.Objects.requireNonNull(builder.topicArn, "topicArn is required");
            this.confirmationTimeoutInMinutes = builder.confirmationTimeoutInMinutes;
            this.deliveryPolicy = builder.deliveryPolicy;
            this.endpointAutoConfirms = builder.endpointAutoConfirms;
            this.filterPolicy = builder.filterPolicy;
            this.filterPolicyScope = builder.filterPolicyScope;
            this.id = builder.id;
            this.rawMessageDelivery = builder.rawMessageDelivery;
            this.redrivePolicy = builder.redrivePolicy;
            this.replayPolicy = builder.replayPolicy;
            this.subscriptionRoleArn = builder.subscriptionRoleArn;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEndpoint() {
            return this.endpoint;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getTopicArn() {
            return this.topicArn;
        }

        @Override
        public final java.lang.Number getConfirmationTimeoutInMinutes() {
            return this.confirmationTimeoutInMinutes;
        }

        @Override
        public final java.lang.String getDeliveryPolicy() {
            return this.deliveryPolicy;
        }

        @Override
        public final java.lang.Object getEndpointAutoConfirms() {
            return this.endpointAutoConfirms;
        }

        @Override
        public final java.lang.String getFilterPolicy() {
            return this.filterPolicy;
        }

        @Override
        public final java.lang.String getFilterPolicyScope() {
            return this.filterPolicyScope;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getRawMessageDelivery() {
            return this.rawMessageDelivery;
        }

        @Override
        public final java.lang.String getRedrivePolicy() {
            return this.redrivePolicy;
        }

        @Override
        public final java.lang.String getReplayPolicy() {
            return this.replayPolicy;
        }

        @Override
        public final java.lang.String getSubscriptionRoleArn() {
            return this.subscriptionRoleArn;
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

            data.set("endpoint", om.valueToTree(this.getEndpoint()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("topicArn", om.valueToTree(this.getTopicArn()));
            if (this.getConfirmationTimeoutInMinutes() != null) {
                data.set("confirmationTimeoutInMinutes", om.valueToTree(this.getConfirmationTimeoutInMinutes()));
            }
            if (this.getDeliveryPolicy() != null) {
                data.set("deliveryPolicy", om.valueToTree(this.getDeliveryPolicy()));
            }
            if (this.getEndpointAutoConfirms() != null) {
                data.set("endpointAutoConfirms", om.valueToTree(this.getEndpointAutoConfirms()));
            }
            if (this.getFilterPolicy() != null) {
                data.set("filterPolicy", om.valueToTree(this.getFilterPolicy()));
            }
            if (this.getFilterPolicyScope() != null) {
                data.set("filterPolicyScope", om.valueToTree(this.getFilterPolicyScope()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRawMessageDelivery() != null) {
                data.set("rawMessageDelivery", om.valueToTree(this.getRawMessageDelivery()));
            }
            if (this.getRedrivePolicy() != null) {
                data.set("redrivePolicy", om.valueToTree(this.getRedrivePolicy()));
            }
            if (this.getReplayPolicy() != null) {
                data.set("replayPolicy", om.valueToTree(this.getReplayPolicy()));
            }
            if (this.getSubscriptionRoleArn() != null) {
                data.set("subscriptionRoleArn", om.valueToTree(this.getSubscriptionRoleArn()));
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
            struct.set("fqn", om.valueToTree("aws.snsTopicSubscription.SnsTopicSubscriptionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SnsTopicSubscriptionConfig.Jsii$Proxy that = (SnsTopicSubscriptionConfig.Jsii$Proxy) o;

            if (!endpoint.equals(that.endpoint)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!topicArn.equals(that.topicArn)) return false;
            if (this.confirmationTimeoutInMinutes != null ? !this.confirmationTimeoutInMinutes.equals(that.confirmationTimeoutInMinutes) : that.confirmationTimeoutInMinutes != null) return false;
            if (this.deliveryPolicy != null ? !this.deliveryPolicy.equals(that.deliveryPolicy) : that.deliveryPolicy != null) return false;
            if (this.endpointAutoConfirms != null ? !this.endpointAutoConfirms.equals(that.endpointAutoConfirms) : that.endpointAutoConfirms != null) return false;
            if (this.filterPolicy != null ? !this.filterPolicy.equals(that.filterPolicy) : that.filterPolicy != null) return false;
            if (this.filterPolicyScope != null ? !this.filterPolicyScope.equals(that.filterPolicyScope) : that.filterPolicyScope != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.rawMessageDelivery != null ? !this.rawMessageDelivery.equals(that.rawMessageDelivery) : that.rawMessageDelivery != null) return false;
            if (this.redrivePolicy != null ? !this.redrivePolicy.equals(that.redrivePolicy) : that.redrivePolicy != null) return false;
            if (this.replayPolicy != null ? !this.replayPolicy.equals(that.replayPolicy) : that.replayPolicy != null) return false;
            if (this.subscriptionRoleArn != null ? !this.subscriptionRoleArn.equals(that.subscriptionRoleArn) : that.subscriptionRoleArn != null) return false;
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
            int result = this.endpoint.hashCode();
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.topicArn.hashCode());
            result = 31 * result + (this.confirmationTimeoutInMinutes != null ? this.confirmationTimeoutInMinutes.hashCode() : 0);
            result = 31 * result + (this.deliveryPolicy != null ? this.deliveryPolicy.hashCode() : 0);
            result = 31 * result + (this.endpointAutoConfirms != null ? this.endpointAutoConfirms.hashCode() : 0);
            result = 31 * result + (this.filterPolicy != null ? this.filterPolicy.hashCode() : 0);
            result = 31 * result + (this.filterPolicyScope != null ? this.filterPolicyScope.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.rawMessageDelivery != null ? this.rawMessageDelivery.hashCode() : 0);
            result = 31 * result + (this.redrivePolicy != null ? this.redrivePolicy.hashCode() : 0);
            result = 31 * result + (this.replayPolicy != null ? this.replayPolicy.hashCode() : 0);
            result = 31 * result + (this.subscriptionRoleArn != null ? this.subscriptionRoleArn.hashCode() : 0);
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
