package imports.aws.appstream_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamFleet.AppstreamFleetDomainJoinInfo")
@software.amazon.jsii.Jsii.Proxy(AppstreamFleetDomainJoinInfo.Jsii$Proxy.class)
public interface AppstreamFleetDomainJoinInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#directory_name AppstreamFleet#directory_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#organizational_unit_distinguished_name AppstreamFleet#organizational_unit_distinguished_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOrganizationalUnitDistinguishedName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamFleetDomainJoinInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamFleetDomainJoinInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamFleetDomainJoinInfo> {
        java.lang.String directoryName;
        java.lang.String organizationalUnitDistinguishedName;

        /**
         * Sets the value of {@link AppstreamFleetDomainJoinInfo#getDirectoryName}
         * @param directoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#directory_name AppstreamFleet#directory_name}.
         * @return {@code this}
         */
        public Builder directoryName(java.lang.String directoryName) {
            this.directoryName = directoryName;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetDomainJoinInfo#getOrganizationalUnitDistinguishedName}
         * @param organizationalUnitDistinguishedName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#organizational_unit_distinguished_name AppstreamFleet#organizational_unit_distinguished_name}.
         * @return {@code this}
         */
        public Builder organizationalUnitDistinguishedName(java.lang.String organizationalUnitDistinguishedName) {
            this.organizationalUnitDistinguishedName = organizationalUnitDistinguishedName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamFleetDomainJoinInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamFleetDomainJoinInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamFleetDomainJoinInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamFleetDomainJoinInfo {
        private final java.lang.String directoryName;
        private final java.lang.String organizationalUnitDistinguishedName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.directoryName = software.amazon.jsii.Kernel.get(this, "directoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.organizationalUnitDistinguishedName = software.amazon.jsii.Kernel.get(this, "organizationalUnitDistinguishedName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.directoryName = builder.directoryName;
            this.organizationalUnitDistinguishedName = builder.organizationalUnitDistinguishedName;
        }

        @Override
        public final java.lang.String getDirectoryName() {
            return this.directoryName;
        }

        @Override
        public final java.lang.String getOrganizationalUnitDistinguishedName() {
            return this.organizationalUnitDistinguishedName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDirectoryName() != null) {
                data.set("directoryName", om.valueToTree(this.getDirectoryName()));
            }
            if (this.getOrganizationalUnitDistinguishedName() != null) {
                data.set("organizationalUnitDistinguishedName", om.valueToTree(this.getOrganizationalUnitDistinguishedName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamFleet.AppstreamFleetDomainJoinInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamFleetDomainJoinInfo.Jsii$Proxy that = (AppstreamFleetDomainJoinInfo.Jsii$Proxy) o;

            if (this.directoryName != null ? !this.directoryName.equals(that.directoryName) : that.directoryName != null) return false;
            return this.organizationalUnitDistinguishedName != null ? this.organizationalUnitDistinguishedName.equals(that.organizationalUnitDistinguishedName) : that.organizationalUnitDistinguishedName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.directoryName != null ? this.directoryName.hashCode() : 0;
            result = 31 * result + (this.organizationalUnitDistinguishedName != null ? this.organizationalUnitDistinguishedName.hashCode() : 0);
            return result;
        }
    }
}
