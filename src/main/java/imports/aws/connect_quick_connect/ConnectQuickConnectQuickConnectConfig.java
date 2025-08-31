package imports.aws.connect_quick_connect;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.388Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectQuickConnectQuickConnectConfig.Jsii$Proxy.class)
public interface ConnectQuickConnectQuickConnectConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#quick_connect_type ConnectQuickConnect#quick_connect_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQuickConnectType();

    /**
     * phone_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#phone_config ConnectQuickConnect#phone_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPhoneConfig() {
        return null;
    }

    /**
     * queue_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#queue_config ConnectQuickConnect#queue_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueueConfig() {
        return null;
    }

    /**
     * user_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#user_config ConnectQuickConnect#user_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectQuickConnectQuickConnectConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectQuickConnectQuickConnectConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectQuickConnectQuickConnectConfig> {
        java.lang.String quickConnectType;
        java.lang.Object phoneConfig;
        java.lang.Object queueConfig;
        java.lang.Object userConfig;

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfig#getQuickConnectType}
         * @param quickConnectType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#quick_connect_type ConnectQuickConnect#quick_connect_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder quickConnectType(java.lang.String quickConnectType) {
            this.quickConnectType = quickConnectType;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfig#getPhoneConfig}
         * @param phoneConfig phone_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#phone_config ConnectQuickConnect#phone_config}
         * @return {@code this}
         */
        public Builder phoneConfig(com.hashicorp.cdktf.IResolvable phoneConfig) {
            this.phoneConfig = phoneConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfig#getPhoneConfig}
         * @param phoneConfig phone_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#phone_config ConnectQuickConnect#phone_config}
         * @return {@code this}
         */
        public Builder phoneConfig(java.util.List<? extends imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigPhoneConfig> phoneConfig) {
            this.phoneConfig = phoneConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfig#getQueueConfig}
         * @param queueConfig queue_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#queue_config ConnectQuickConnect#queue_config}
         * @return {@code this}
         */
        public Builder queueConfig(com.hashicorp.cdktf.IResolvable queueConfig) {
            this.queueConfig = queueConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfig#getQueueConfig}
         * @param queueConfig queue_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#queue_config ConnectQuickConnect#queue_config}
         * @return {@code this}
         */
        public Builder queueConfig(java.util.List<? extends imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigQueueConfig> queueConfig) {
            this.queueConfig = queueConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfig#getUserConfig}
         * @param userConfig user_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#user_config ConnectQuickConnect#user_config}
         * @return {@code this}
         */
        public Builder userConfig(com.hashicorp.cdktf.IResolvable userConfig) {
            this.userConfig = userConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfig#getUserConfig}
         * @param userConfig user_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#user_config ConnectQuickConnect#user_config}
         * @return {@code this}
         */
        public Builder userConfig(java.util.List<? extends imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigUserConfig> userConfig) {
            this.userConfig = userConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectQuickConnectQuickConnectConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectQuickConnectQuickConnectConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectQuickConnectQuickConnectConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectQuickConnectQuickConnectConfig {
        private final java.lang.String quickConnectType;
        private final java.lang.Object phoneConfig;
        private final java.lang.Object queueConfig;
        private final java.lang.Object userConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.quickConnectType = software.amazon.jsii.Kernel.get(this, "quickConnectType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneConfig = software.amazon.jsii.Kernel.get(this, "phoneConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.queueConfig = software.amazon.jsii.Kernel.get(this, "queueConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.userConfig = software.amazon.jsii.Kernel.get(this, "userConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.quickConnectType = java.util.Objects.requireNonNull(builder.quickConnectType, "quickConnectType is required");
            this.phoneConfig = builder.phoneConfig;
            this.queueConfig = builder.queueConfig;
            this.userConfig = builder.userConfig;
        }

        @Override
        public final java.lang.String getQuickConnectType() {
            return this.quickConnectType;
        }

        @Override
        public final java.lang.Object getPhoneConfig() {
            return this.phoneConfig;
        }

        @Override
        public final java.lang.Object getQueueConfig() {
            return this.queueConfig;
        }

        @Override
        public final java.lang.Object getUserConfig() {
            return this.userConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("quickConnectType", om.valueToTree(this.getQuickConnectType()));
            if (this.getPhoneConfig() != null) {
                data.set("phoneConfig", om.valueToTree(this.getPhoneConfig()));
            }
            if (this.getQueueConfig() != null) {
                data.set("queueConfig", om.valueToTree(this.getQueueConfig()));
            }
            if (this.getUserConfig() != null) {
                data.set("userConfig", om.valueToTree(this.getUserConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectQuickConnectQuickConnectConfig.Jsii$Proxy that = (ConnectQuickConnectQuickConnectConfig.Jsii$Proxy) o;

            if (!quickConnectType.equals(that.quickConnectType)) return false;
            if (this.phoneConfig != null ? !this.phoneConfig.equals(that.phoneConfig) : that.phoneConfig != null) return false;
            if (this.queueConfig != null ? !this.queueConfig.equals(that.queueConfig) : that.queueConfig != null) return false;
            return this.userConfig != null ? this.userConfig.equals(that.userConfig) : that.userConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.quickConnectType.hashCode();
            result = 31 * result + (this.phoneConfig != null ? this.phoneConfig.hashCode() : 0);
            result = 31 * result + (this.queueConfig != null ? this.queueConfig.hashCode() : 0);
            result = 31 * result + (this.userConfig != null ? this.userConfig.hashCode() : 0);
            return result;
        }
    }
}
