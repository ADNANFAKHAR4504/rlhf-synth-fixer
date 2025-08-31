package imports.aws.sns_topic_subscription;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription aws_sns_topic_subscription}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.477Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsTopicSubscription.SnsTopicSubscription")
public class SnsTopicSubscription extends com.hashicorp.cdktf.TerraformResource {

    protected SnsTopicSubscription(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SnsTopicSubscription(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sns_topic_subscription.SnsTopicSubscription.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription aws_sns_topic_subscription} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SnsTopicSubscription(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sns_topic_subscription.SnsTopicSubscriptionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SnsTopicSubscription resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsTopicSubscription to import. This parameter is required.
     * @param importFromId The id of the existing SnsTopicSubscription that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SnsTopicSubscription to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_topic_subscription.SnsTopicSubscription.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SnsTopicSubscription resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsTopicSubscription to import. This parameter is required.
     * @param importFromId The id of the existing SnsTopicSubscription that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_topic_subscription.SnsTopicSubscription.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetConfirmationTimeoutInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetConfirmationTimeoutInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeliveryPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointAutoConfirms() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointAutoConfirms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetFilterPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterPolicyScope() {
        software.amazon.jsii.Kernel.call(this, "resetFilterPolicyScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRawMessageDelivery() {
        software.amazon.jsii.Kernel.call(this, "resetRawMessageDelivery", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedrivePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRedrivePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplayPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetReplayPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubscriptionRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetSubscriptionRoleArn", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getConfirmationWasAuthenticated() {
        return software.amazon.jsii.Kernel.get(this, "confirmationWasAuthenticated", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getPendingConfirmation() {
        return software.amazon.jsii.Kernel.get(this, "pendingConfirmation", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConfirmationTimeoutInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "confirmationTimeoutInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEndpointAutoConfirmsInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointAutoConfirmsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFilterPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "filterPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFilterPolicyScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "filterPolicyScopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRawMessageDeliveryInput() {
        return software.amazon.jsii.Kernel.get(this, "rawMessageDeliveryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRedrivePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "redrivePolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplayPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "replayPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubscriptionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "subscriptionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "topicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConfirmationTimeoutInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "confirmationTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConfirmationTimeoutInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "confirmationTimeoutInMinutes", java.util.Objects.requireNonNull(value, "confirmationTimeoutInMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryPolicy() {
        return software.amazon.jsii.Kernel.get(this, "deliveryPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryPolicy", java.util.Objects.requireNonNull(value, "deliveryPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpoint", java.util.Objects.requireNonNull(value, "endpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEndpointAutoConfirms() {
        return software.amazon.jsii.Kernel.get(this, "endpointAutoConfirms", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEndpointAutoConfirms(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "endpointAutoConfirms", java.util.Objects.requireNonNull(value, "endpointAutoConfirms is required"));
    }

    public void setEndpointAutoConfirms(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "endpointAutoConfirms", java.util.Objects.requireNonNull(value, "endpointAutoConfirms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFilterPolicy() {
        return software.amazon.jsii.Kernel.get(this, "filterPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFilterPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "filterPolicy", java.util.Objects.requireNonNull(value, "filterPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFilterPolicyScope() {
        return software.amazon.jsii.Kernel.get(this, "filterPolicyScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFilterPolicyScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "filterPolicyScope", java.util.Objects.requireNonNull(value, "filterPolicyScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRawMessageDelivery() {
        return software.amazon.jsii.Kernel.get(this, "rawMessageDelivery", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRawMessageDelivery(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "rawMessageDelivery", java.util.Objects.requireNonNull(value, "rawMessageDelivery is required"));
    }

    public void setRawMessageDelivery(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "rawMessageDelivery", java.util.Objects.requireNonNull(value, "rawMessageDelivery is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRedrivePolicy() {
        return software.amazon.jsii.Kernel.get(this, "redrivePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRedrivePolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "redrivePolicy", java.util.Objects.requireNonNull(value, "redrivePolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplayPolicy() {
        return software.amazon.jsii.Kernel.get(this, "replayPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplayPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replayPolicy", java.util.Objects.requireNonNull(value, "replayPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubscriptionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "subscriptionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubscriptionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subscriptionRoleArn", java.util.Objects.requireNonNull(value, "subscriptionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "topicArn", java.util.Objects.requireNonNull(value, "topicArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sns_topic_subscription.SnsTopicSubscription}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sns_topic_subscription.SnsTopicSubscription> {
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
        private final imports.aws.sns_topic_subscription.SnsTopicSubscriptionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sns_topic_subscription.SnsTopicSubscriptionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint SnsTopicSubscription#endpoint}.
         * <p>
         * @return {@code this}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint SnsTopicSubscription#endpoint}. This parameter is required.
         */
        public Builder endpoint(final java.lang.String endpoint) {
            this.config.endpoint(endpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#protocol SnsTopicSubscription#protocol}.
         * <p>
         * @return {@code this}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#protocol SnsTopicSubscription#protocol}. This parameter is required.
         */
        public Builder protocol(final java.lang.String protocol) {
            this.config.protocol(protocol);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#topic_arn SnsTopicSubscription#topic_arn}.
         * <p>
         * @return {@code this}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#topic_arn SnsTopicSubscription#topic_arn}. This parameter is required.
         */
        public Builder topicArn(final java.lang.String topicArn) {
            this.config.topicArn(topicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#confirmation_timeout_in_minutes SnsTopicSubscription#confirmation_timeout_in_minutes}.
         * <p>
         * @return {@code this}
         * @param confirmationTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#confirmation_timeout_in_minutes SnsTopicSubscription#confirmation_timeout_in_minutes}. This parameter is required.
         */
        public Builder confirmationTimeoutInMinutes(final java.lang.Number confirmationTimeoutInMinutes) {
            this.config.confirmationTimeoutInMinutes(confirmationTimeoutInMinutes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#delivery_policy SnsTopicSubscription#delivery_policy}.
         * <p>
         * @return {@code this}
         * @param deliveryPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#delivery_policy SnsTopicSubscription#delivery_policy}. This parameter is required.
         */
        public Builder deliveryPolicy(final java.lang.String deliveryPolicy) {
            this.config.deliveryPolicy(deliveryPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint_auto_confirms SnsTopicSubscription#endpoint_auto_confirms}.
         * <p>
         * @return {@code this}
         * @param endpointAutoConfirms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint_auto_confirms SnsTopicSubscription#endpoint_auto_confirms}. This parameter is required.
         */
        public Builder endpointAutoConfirms(final java.lang.Boolean endpointAutoConfirms) {
            this.config.endpointAutoConfirms(endpointAutoConfirms);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint_auto_confirms SnsTopicSubscription#endpoint_auto_confirms}.
         * <p>
         * @return {@code this}
         * @param endpointAutoConfirms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#endpoint_auto_confirms SnsTopicSubscription#endpoint_auto_confirms}. This parameter is required.
         */
        public Builder endpointAutoConfirms(final com.hashicorp.cdktf.IResolvable endpointAutoConfirms) {
            this.config.endpointAutoConfirms(endpointAutoConfirms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy SnsTopicSubscription#filter_policy}.
         * <p>
         * @return {@code this}
         * @param filterPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy SnsTopicSubscription#filter_policy}. This parameter is required.
         */
        public Builder filterPolicy(final java.lang.String filterPolicy) {
            this.config.filterPolicy(filterPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy_scope SnsTopicSubscription#filter_policy_scope}.
         * <p>
         * @return {@code this}
         * @param filterPolicyScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#filter_policy_scope SnsTopicSubscription#filter_policy_scope}. This parameter is required.
         */
        public Builder filterPolicyScope(final java.lang.String filterPolicyScope) {
            this.config.filterPolicyScope(filterPolicyScope);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#id SnsTopicSubscription#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#id SnsTopicSubscription#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#raw_message_delivery SnsTopicSubscription#raw_message_delivery}.
         * <p>
         * @return {@code this}
         * @param rawMessageDelivery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#raw_message_delivery SnsTopicSubscription#raw_message_delivery}. This parameter is required.
         */
        public Builder rawMessageDelivery(final java.lang.Boolean rawMessageDelivery) {
            this.config.rawMessageDelivery(rawMessageDelivery);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#raw_message_delivery SnsTopicSubscription#raw_message_delivery}.
         * <p>
         * @return {@code this}
         * @param rawMessageDelivery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#raw_message_delivery SnsTopicSubscription#raw_message_delivery}. This parameter is required.
         */
        public Builder rawMessageDelivery(final com.hashicorp.cdktf.IResolvable rawMessageDelivery) {
            this.config.rawMessageDelivery(rawMessageDelivery);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#redrive_policy SnsTopicSubscription#redrive_policy}.
         * <p>
         * @return {@code this}
         * @param redrivePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#redrive_policy SnsTopicSubscription#redrive_policy}. This parameter is required.
         */
        public Builder redrivePolicy(final java.lang.String redrivePolicy) {
            this.config.redrivePolicy(redrivePolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#replay_policy SnsTopicSubscription#replay_policy}.
         * <p>
         * @return {@code this}
         * @param replayPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#replay_policy SnsTopicSubscription#replay_policy}. This parameter is required.
         */
        public Builder replayPolicy(final java.lang.String replayPolicy) {
            this.config.replayPolicy(replayPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#subscription_role_arn SnsTopicSubscription#subscription_role_arn}.
         * <p>
         * @return {@code this}
         * @param subscriptionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic_subscription#subscription_role_arn SnsTopicSubscription#subscription_role_arn}. This parameter is required.
         */
        public Builder subscriptionRoleArn(final java.lang.String subscriptionRoleArn) {
            this.config.subscriptionRoleArn(subscriptionRoleArn);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sns_topic_subscription.SnsTopicSubscription}.
         */
        @Override
        public imports.aws.sns_topic_subscription.SnsTopicSubscription build() {
            return new imports.aws.sns_topic_subscription.SnsTopicSubscription(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
