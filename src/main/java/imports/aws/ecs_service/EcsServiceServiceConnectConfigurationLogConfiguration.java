package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationLogConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsServiceServiceConnectConfigurationLogConfiguration.Jsii$Proxy.class)
public interface EcsServiceServiceConnectConfigurationLogConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#log_driver EcsService#log_driver}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogDriver();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#options EcsService#options}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getOptions() {
        return null;
    }

    /**
     * secret_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#secret_option EcsService#secret_option}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSecretOption() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceServiceConnectConfigurationLogConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceServiceConnectConfigurationLogConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceServiceConnectConfigurationLogConfiguration> {
        java.lang.String logDriver;
        java.util.Map<java.lang.String, java.lang.String> options;
        java.lang.Object secretOption;

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationLogConfiguration#getLogDriver}
         * @param logDriver Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#log_driver EcsService#log_driver}. This parameter is required.
         * @return {@code this}
         */
        public Builder logDriver(java.lang.String logDriver) {
            this.logDriver = logDriver;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationLogConfiguration#getOptions}
         * @param options Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#options EcsService#options}.
         * @return {@code this}
         */
        public Builder options(java.util.Map<java.lang.String, java.lang.String> options) {
            this.options = options;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationLogConfiguration#getSecretOption}
         * @param secretOption secret_option block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#secret_option EcsService#secret_option}
         * @return {@code this}
         */
        public Builder secretOption(com.hashicorp.cdktf.IResolvable secretOption) {
            this.secretOption = secretOption;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationLogConfiguration#getSecretOption}
         * @param secretOption secret_option block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#secret_option EcsService#secret_option}
         * @return {@code this}
         */
        public Builder secretOption(java.util.List<? extends imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfigurationSecretOption> secretOption) {
            this.secretOption = secretOption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceServiceConnectConfigurationLogConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceServiceConnectConfigurationLogConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceServiceConnectConfigurationLogConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceServiceConnectConfigurationLogConfiguration {
        private final java.lang.String logDriver;
        private final java.util.Map<java.lang.String, java.lang.String> options;
        private final java.lang.Object secretOption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logDriver = software.amazon.jsii.Kernel.get(this, "logDriver", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.options = software.amazon.jsii.Kernel.get(this, "options", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.secretOption = software.amazon.jsii.Kernel.get(this, "secretOption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logDriver = java.util.Objects.requireNonNull(builder.logDriver, "logDriver is required");
            this.options = builder.options;
            this.secretOption = builder.secretOption;
        }

        @Override
        public final java.lang.String getLogDriver() {
            return this.logDriver;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getOptions() {
            return this.options;
        }

        @Override
        public final java.lang.Object getSecretOption() {
            return this.secretOption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logDriver", om.valueToTree(this.getLogDriver()));
            if (this.getOptions() != null) {
                data.set("options", om.valueToTree(this.getOptions()));
            }
            if (this.getSecretOption() != null) {
                data.set("secretOption", om.valueToTree(this.getSecretOption()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceServiceConnectConfigurationLogConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceServiceConnectConfigurationLogConfiguration.Jsii$Proxy that = (EcsServiceServiceConnectConfigurationLogConfiguration.Jsii$Proxy) o;

            if (!logDriver.equals(that.logDriver)) return false;
            if (this.options != null ? !this.options.equals(that.options) : that.options != null) return false;
            return this.secretOption != null ? this.secretOption.equals(that.secretOption) : that.secretOption == null;
        }

        @Override
        public final int hashCode() {
            int result = this.logDriver.hashCode();
            result = 31 * result + (this.options != null ? this.options.hashCode() : 0);
            result = 31 * result + (this.secretOption != null ? this.secretOption.hashCode() : 0);
            return result;
        }
    }
}
