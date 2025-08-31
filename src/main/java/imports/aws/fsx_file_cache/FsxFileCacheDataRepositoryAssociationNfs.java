package imports.aws.fsx_file_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxFileCache.FsxFileCacheDataRepositoryAssociationNfs")
@software.amazon.jsii.Jsii.Proxy(FsxFileCacheDataRepositoryAssociationNfs.Jsii$Proxy.class)
public interface FsxFileCacheDataRepositoryAssociationNfs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#version FsxFileCache#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#dns_ips FsxFileCache#dns_ips}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDnsIps() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxFileCacheDataRepositoryAssociationNfs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxFileCacheDataRepositoryAssociationNfs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxFileCacheDataRepositoryAssociationNfs> {
        java.lang.String version;
        java.util.List<java.lang.String> dnsIps;

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociationNfs#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#version FsxFileCache#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheDataRepositoryAssociationNfs#getDnsIps}
         * @param dnsIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#dns_ips FsxFileCache#dns_ips}.
         * @return {@code this}
         */
        public Builder dnsIps(java.util.List<java.lang.String> dnsIps) {
            this.dnsIps = dnsIps;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxFileCacheDataRepositoryAssociationNfs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxFileCacheDataRepositoryAssociationNfs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxFileCacheDataRepositoryAssociationNfs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxFileCacheDataRepositoryAssociationNfs {
        private final java.lang.String version;
        private final java.util.List<java.lang.String> dnsIps;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dnsIps = software.amazon.jsii.Kernel.get(this, "dnsIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.dnsIps = builder.dnsIps;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.util.List<java.lang.String> getDnsIps() {
            return this.dnsIps;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getDnsIps() != null) {
                data.set("dnsIps", om.valueToTree(this.getDnsIps()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxFileCache.FsxFileCacheDataRepositoryAssociationNfs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxFileCacheDataRepositoryAssociationNfs.Jsii$Proxy that = (FsxFileCacheDataRepositoryAssociationNfs.Jsii$Proxy) o;

            if (!version.equals(that.version)) return false;
            return this.dnsIps != null ? this.dnsIps.equals(that.dnsIps) : that.dnsIps == null;
        }

        @Override
        public final int hashCode() {
            int result = this.version.hashCode();
            result = 31 * result + (this.dnsIps != null ? this.dnsIps.hashCode() : 0);
            return result;
        }
    }
}
