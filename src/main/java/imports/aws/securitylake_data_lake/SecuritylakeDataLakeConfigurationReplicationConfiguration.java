package imports.aws.securitylake_data_lake;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.420Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationReplicationConfiguration")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeDataLakeConfigurationReplicationConfiguration.Jsii$Proxy.class)
public interface SecuritylakeDataLakeConfigurationReplicationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#regions SecuritylakeDataLake#regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#role_arn SecuritylakeDataLake#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeDataLakeConfigurationReplicationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeDataLakeConfigurationReplicationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeDataLakeConfigurationReplicationConfiguration> {
        java.util.List<java.lang.String> regions;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationReplicationConfiguration#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#regions SecuritylakeDataLake#regions}.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationReplicationConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#role_arn SecuritylakeDataLake#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeDataLakeConfigurationReplicationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeDataLakeConfigurationReplicationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeDataLakeConfigurationReplicationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeDataLakeConfigurationReplicationConfiguration {
        private final java.util.List<java.lang.String> regions;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.regions = builder.regions;
            this.roleArn = builder.roleArn;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRegions() != null) {
                data.set("regions", om.valueToTree(this.getRegions()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationReplicationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeDataLakeConfigurationReplicationConfiguration.Jsii$Proxy that = (SecuritylakeDataLakeConfigurationReplicationConfiguration.Jsii$Proxy) o;

            if (this.regions != null ? !this.regions.equals(that.regions) : that.regions != null) return false;
            return this.roleArn != null ? this.roleArn.equals(that.roleArn) : that.roleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.regions != null ? this.regions.hashCode() : 0;
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            return result;
        }
    }
}
