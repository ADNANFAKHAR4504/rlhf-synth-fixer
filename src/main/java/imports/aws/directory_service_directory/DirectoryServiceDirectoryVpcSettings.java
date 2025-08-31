package imports.aws.directory_service_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.001Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.directoryServiceDirectory.DirectoryServiceDirectoryVpcSettings")
@software.amazon.jsii.Jsii.Proxy(DirectoryServiceDirectoryVpcSettings.Jsii$Proxy.class)
public interface DirectoryServiceDirectoryVpcSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#subnet_ids DirectoryServiceDirectory#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#vpc_id DirectoryServiceDirectory#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * @return a {@link Builder} of {@link DirectoryServiceDirectoryVpcSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DirectoryServiceDirectoryVpcSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DirectoryServiceDirectoryVpcSettings> {
        java.util.List<java.lang.String> subnetIds;
        java.lang.String vpcId;

        /**
         * Sets the value of {@link DirectoryServiceDirectoryVpcSettings#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#subnet_ids DirectoryServiceDirectory#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryVpcSettings#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#vpc_id DirectoryServiceDirectory#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DirectoryServiceDirectoryVpcSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DirectoryServiceDirectoryVpcSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DirectoryServiceDirectoryVpcSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DirectoryServiceDirectoryVpcSettings {
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String vpcId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
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

            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.directoryServiceDirectory.DirectoryServiceDirectoryVpcSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DirectoryServiceDirectoryVpcSettings.Jsii$Proxy that = (DirectoryServiceDirectoryVpcSettings.Jsii$Proxy) o;

            if (!subnetIds.equals(that.subnetIds)) return false;
            return this.vpcId.equals(that.vpcId);
        }

        @Override
        public final int hashCode() {
            int result = this.subnetIds.hashCode();
            result = 31 * result + (this.vpcId.hashCode());
            return result;
        }
    }
}
