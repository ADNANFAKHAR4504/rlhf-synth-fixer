package imports.aws.efs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.143Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsFileSystem.EfsFileSystemProtection")
@software.amazon.jsii.Jsii.Proxy(EfsFileSystemProtection.Jsii$Proxy.class)
public interface EfsFileSystemProtection extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#replication_overwrite EfsFileSystem#replication_overwrite}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicationOverwrite() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EfsFileSystemProtection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EfsFileSystemProtection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EfsFileSystemProtection> {
        java.lang.String replicationOverwrite;

        /**
         * Sets the value of {@link EfsFileSystemProtection#getReplicationOverwrite}
         * @param replicationOverwrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#replication_overwrite EfsFileSystem#replication_overwrite}.
         * @return {@code this}
         */
        public Builder replicationOverwrite(java.lang.String replicationOverwrite) {
            this.replicationOverwrite = replicationOverwrite;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EfsFileSystemProtection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EfsFileSystemProtection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EfsFileSystemProtection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EfsFileSystemProtection {
        private final java.lang.String replicationOverwrite;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.replicationOverwrite = software.amazon.jsii.Kernel.get(this, "replicationOverwrite", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.replicationOverwrite = builder.replicationOverwrite;
        }

        @Override
        public final java.lang.String getReplicationOverwrite() {
            return this.replicationOverwrite;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getReplicationOverwrite() != null) {
                data.set("replicationOverwrite", om.valueToTree(this.getReplicationOverwrite()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.efsFileSystem.EfsFileSystemProtection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EfsFileSystemProtection.Jsii$Proxy that = (EfsFileSystemProtection.Jsii$Proxy) o;

            return this.replicationOverwrite != null ? this.replicationOverwrite.equals(that.replicationOverwrite) : that.replicationOverwrite == null;
        }

        @Override
        public final int hashCode() {
            int result = this.replicationOverwrite != null ? this.replicationOverwrite.hashCode() : 0;
            return result;
        }
    }
}
