package imports.aws.pinpoint_email_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointEmailChannel.PinpointEmailChannelConfig")
@software.amazon.jsii.Jsii.Proxy(PinpointEmailChannelConfig.Jsii$Proxy.class)
public interface PinpointEmailChannelConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#application_id PinpointEmailChannel#application_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApplicationId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#from_address PinpointEmailChannel#from_address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFromAddress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#identity PinpointEmailChannel#identity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#configuration_set PinpointEmailChannel#configuration_set}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurationSet() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#enabled PinpointEmailChannel#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#id PinpointEmailChannel#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#orchestration_sending_role_arn PinpointEmailChannel#orchestration_sending_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOrchestrationSendingRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#role_arn PinpointEmailChannel#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PinpointEmailChannelConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PinpointEmailChannelConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PinpointEmailChannelConfig> {
        java.lang.String applicationId;
        java.lang.String fromAddress;
        java.lang.String identity;
        java.lang.String configurationSet;
        java.lang.Object enabled;
        java.lang.String id;
        java.lang.String orchestrationSendingRoleArn;
        java.lang.String roleArn;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getApplicationId}
         * @param applicationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#application_id PinpointEmailChannel#application_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder applicationId(java.lang.String applicationId) {
            this.applicationId = applicationId;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getFromAddress}
         * @param fromAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#from_address PinpointEmailChannel#from_address}. This parameter is required.
         * @return {@code this}
         */
        public Builder fromAddress(java.lang.String fromAddress) {
            this.fromAddress = fromAddress;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getIdentity}
         * @param identity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#identity PinpointEmailChannel#identity}. This parameter is required.
         * @return {@code this}
         */
        public Builder identity(java.lang.String identity) {
            this.identity = identity;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getConfigurationSet}
         * @param configurationSet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#configuration_set PinpointEmailChannel#configuration_set}.
         * @return {@code this}
         */
        public Builder configurationSet(java.lang.String configurationSet) {
            this.configurationSet = configurationSet;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#enabled PinpointEmailChannel#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#enabled PinpointEmailChannel#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#id PinpointEmailChannel#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getOrchestrationSendingRoleArn}
         * @param orchestrationSendingRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#orchestration_sending_role_arn PinpointEmailChannel#orchestration_sending_role_arn}.
         * @return {@code this}
         */
        public Builder orchestrationSendingRoleArn(java.lang.String orchestrationSendingRoleArn) {
            this.orchestrationSendingRoleArn = orchestrationSendingRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_channel#role_arn PinpointEmailChannel#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getDependsOn}
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
         * Sets the value of {@link PinpointEmailChannelConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailChannelConfig#getProvisioners}
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
         * @return a new instance of {@link PinpointEmailChannelConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PinpointEmailChannelConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PinpointEmailChannelConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PinpointEmailChannelConfig {
        private final java.lang.String applicationId;
        private final java.lang.String fromAddress;
        private final java.lang.String identity;
        private final java.lang.String configurationSet;
        private final java.lang.Object enabled;
        private final java.lang.String id;
        private final java.lang.String orchestrationSendingRoleArn;
        private final java.lang.String roleArn;
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
            this.applicationId = software.amazon.jsii.Kernel.get(this, "applicationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fromAddress = software.amazon.jsii.Kernel.get(this, "fromAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identity = software.amazon.jsii.Kernel.get(this, "identity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurationSet = software.amazon.jsii.Kernel.get(this, "configurationSet", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.orchestrationSendingRoleArn = software.amazon.jsii.Kernel.get(this, "orchestrationSendingRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.applicationId = java.util.Objects.requireNonNull(builder.applicationId, "applicationId is required");
            this.fromAddress = java.util.Objects.requireNonNull(builder.fromAddress, "fromAddress is required");
            this.identity = java.util.Objects.requireNonNull(builder.identity, "identity is required");
            this.configurationSet = builder.configurationSet;
            this.enabled = builder.enabled;
            this.id = builder.id;
            this.orchestrationSendingRoleArn = builder.orchestrationSendingRoleArn;
            this.roleArn = builder.roleArn;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getApplicationId() {
            return this.applicationId;
        }

        @Override
        public final java.lang.String getFromAddress() {
            return this.fromAddress;
        }

        @Override
        public final java.lang.String getIdentity() {
            return this.identity;
        }

        @Override
        public final java.lang.String getConfigurationSet() {
            return this.configurationSet;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getOrchestrationSendingRoleArn() {
            return this.orchestrationSendingRoleArn;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
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

            data.set("applicationId", om.valueToTree(this.getApplicationId()));
            data.set("fromAddress", om.valueToTree(this.getFromAddress()));
            data.set("identity", om.valueToTree(this.getIdentity()));
            if (this.getConfigurationSet() != null) {
                data.set("configurationSet", om.valueToTree(this.getConfigurationSet()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOrchestrationSendingRoleArn() != null) {
                data.set("orchestrationSendingRoleArn", om.valueToTree(this.getOrchestrationSendingRoleArn()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
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
            struct.set("fqn", om.valueToTree("aws.pinpointEmailChannel.PinpointEmailChannelConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PinpointEmailChannelConfig.Jsii$Proxy that = (PinpointEmailChannelConfig.Jsii$Proxy) o;

            if (!applicationId.equals(that.applicationId)) return false;
            if (!fromAddress.equals(that.fromAddress)) return false;
            if (!identity.equals(that.identity)) return false;
            if (this.configurationSet != null ? !this.configurationSet.equals(that.configurationSet) : that.configurationSet != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.orchestrationSendingRoleArn != null ? !this.orchestrationSendingRoleArn.equals(that.orchestrationSendingRoleArn) : that.orchestrationSendingRoleArn != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
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
            int result = this.applicationId.hashCode();
            result = 31 * result + (this.fromAddress.hashCode());
            result = 31 * result + (this.identity.hashCode());
            result = 31 * result + (this.configurationSet != null ? this.configurationSet.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.orchestrationSendingRoleArn != null ? this.orchestrationSendingRoleArn.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
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
