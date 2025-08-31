package imports.aws.securitylake_data_lake;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.420Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration.Jsii$Proxy.class)
public interface SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#days SecuritylakeDataLake#days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration> {
        java.lang.Number days;

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration#getDays}
         * @param days Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#days SecuritylakeDataLake#days}.
         * @return {@code this}
         */
        public Builder days(java.lang.Number days) {
            this.days = days;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration {
        private final java.lang.Number days;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.days = software.amazon.jsii.Kernel.get(this, "days", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.days = builder.days;
        }

        @Override
        public final java.lang.Number getDays() {
            return this.days;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDays() != null) {
                data.set("days", om.valueToTree(this.getDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration.Jsii$Proxy that = (SecuritylakeDataLakeConfigurationLifecycleConfigurationExpiration.Jsii$Proxy) o;

            return this.days != null ? this.days.equals(that.days) : that.days == null;
        }

        @Override
        public final int hashCode() {
            int result = this.days != null ? this.days.hashCode() : 0;
            return result;
        }
    }
}
