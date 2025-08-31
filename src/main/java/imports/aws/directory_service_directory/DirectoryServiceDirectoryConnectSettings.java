package imports.aws.directory_service_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.001Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.directoryServiceDirectory.DirectoryServiceDirectoryConnectSettings")
@software.amazon.jsii.Jsii.Proxy(DirectoryServiceDirectoryConnectSettings.Jsii$Proxy.class)
public interface DirectoryServiceDirectoryConnectSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#customer_dns_ips DirectoryServiceDirectory#customer_dns_ips}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomerDnsIps();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#customer_username DirectoryServiceDirectory#customer_username}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomerUsername();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#subnet_ids DirectoryServiceDirectory#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#vpc_id DirectoryServiceDirectory#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * @return a {@link Builder} of {@link DirectoryServiceDirectoryConnectSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DirectoryServiceDirectoryConnectSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DirectoryServiceDirectoryConnectSettings> {
        java.util.List<java.lang.String> customerDnsIps;
        java.lang.String customerUsername;
        java.util.List<java.lang.String> subnetIds;
        java.lang.String vpcId;

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConnectSettings#getCustomerDnsIps}
         * @param customerDnsIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#customer_dns_ips DirectoryServiceDirectory#customer_dns_ips}. This parameter is required.
         * @return {@code this}
         */
        public Builder customerDnsIps(java.util.List<java.lang.String> customerDnsIps) {
            this.customerDnsIps = customerDnsIps;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConnectSettings#getCustomerUsername}
         * @param customerUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#customer_username DirectoryServiceDirectory#customer_username}. This parameter is required.
         * @return {@code this}
         */
        public Builder customerUsername(java.lang.String customerUsername) {
            this.customerUsername = customerUsername;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConnectSettings#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#subnet_ids DirectoryServiceDirectory#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConnectSettings#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#vpc_id DirectoryServiceDirectory#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DirectoryServiceDirectoryConnectSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DirectoryServiceDirectoryConnectSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DirectoryServiceDirectoryConnectSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DirectoryServiceDirectoryConnectSettings {
        private final java.util.List<java.lang.String> customerDnsIps;
        private final java.lang.String customerUsername;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String vpcId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customerDnsIps = software.amazon.jsii.Kernel.get(this, "customerDnsIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.customerUsername = software.amazon.jsii.Kernel.get(this, "customerUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customerDnsIps = java.util.Objects.requireNonNull(builder.customerDnsIps, "customerDnsIps is required");
            this.customerUsername = java.util.Objects.requireNonNull(builder.customerUsername, "customerUsername is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
        }

        @Override
        public final java.util.List<java.lang.String> getCustomerDnsIps() {
            return this.customerDnsIps;
        }

        @Override
        public final java.lang.String getCustomerUsername() {
            return this.customerUsername;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("customerDnsIps", om.valueToTree(this.getCustomerDnsIps()));
            data.set("customerUsername", om.valueToTree(this.getCustomerUsername()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.directoryServiceDirectory.DirectoryServiceDirectoryConnectSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DirectoryServiceDirectoryConnectSettings.Jsii$Proxy that = (DirectoryServiceDirectoryConnectSettings.Jsii$Proxy) o;

            if (!customerDnsIps.equals(that.customerDnsIps)) return false;
            if (!customerUsername.equals(that.customerUsername)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            return this.vpcId.equals(that.vpcId);
        }

        @Override
        public final int hashCode() {
            int result = this.customerDnsIps.hashCode();
            result = 31 * result + (this.customerUsername.hashCode());
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            return result;
        }
    }
}
