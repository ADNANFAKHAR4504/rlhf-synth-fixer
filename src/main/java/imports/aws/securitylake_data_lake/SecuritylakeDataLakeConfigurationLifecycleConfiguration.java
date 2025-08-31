package imports.aws.securitylake_data_lake;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.420Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationLifecycleConfiguration")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeDataLakeConfigurationLifecycleConfiguration.Jsii$Proxy.class)
public interface SecuritylakeDataLakeConfigurationLifecycleConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * expiration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#expiration SecuritylakeDataLake#expiration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExpiration() {
        return null;
    }

    /**
     * transition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#transition SecuritylakeDataLake#transition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeDataLakeConfigurationLifecycleConfiguration> {
        java.lang.Object expiration;
        java.lang.Object transition;

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration#getExpiration}
         * @param expiration expiration block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#expiration SecuritylakeDataLake#expiration}
         * @return {@code this}
         */
        public Builder expiration(com.hashicorp.cdktf.IResolvable expiration) {
            this.expiration = expiration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration#getExpiration}
         * @param expiration expiration block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#expiration SecuritylakeDataLake#expiration}
         * @return {@code this}
         */
        public Builder expiration(java.util.List<? extends imports.aws.securitylake_data_lake.SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration> expiration) {
            this.expiration = expiration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration#getTransition}
         * @param transition transition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#transition SecuritylakeDataLake#transition}
         * @return {@code this}
         */
        public Builder transition(com.hashicorp.cdktf.IResolvable transition) {
            this.transition = transition;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration#getTransition}
         * @param transition transition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#transition SecuritylakeDataLake#transition}
         * @return {@code this}
         */
        public Builder transition(java.util.List<? extends imports.aws.securitylake_data_lake.SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition> transition) {
            this.transition = transition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeDataLakeConfigurationLifecycleConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeDataLakeConfigurationLifecycleConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeDataLakeConfigurationLifecycleConfiguration {
        private final java.lang.Object expiration;
        private final java.lang.Object transition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.expiration = software.amazon.jsii.Kernel.get(this, "expiration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.transition = software.amazon.jsii.Kernel.get(this, "transition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.expiration = builder.expiration;
            this.transition = builder.transition;
        }

        @Override
        public final java.lang.Object getExpiration() {
            return this.expiration;
        }

        @Override
        public final java.lang.Object getTransition() {
            return this.transition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExpiration() != null) {
                data.set("expiration", om.valueToTree(this.getExpiration()));
            }
            if (this.getTransition() != null) {
                data.set("transition", om.valueToTree(this.getTransition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationLifecycleConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeDataLakeConfigurationLifecycleConfiguration.Jsii$Proxy that = (SecuritylakeDataLakeConfigurationLifecycleConfiguration.Jsii$Proxy) o;

            if (this.expiration != null ? !this.expiration.equals(that.expiration) : that.expiration != null) return false;
            return this.transition != null ? this.transition.equals(that.transition) : that.transition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.expiration != null ? this.expiration.hashCode() : 0;
            result = 31 * result + (this.transition != null ? this.transition.hashCode() : 0);
            return result;
        }
    }
}
