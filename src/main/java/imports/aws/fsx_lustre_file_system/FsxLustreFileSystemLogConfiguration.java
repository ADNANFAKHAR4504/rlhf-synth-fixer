package imports.aws.fsx_lustre_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystemLogConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxLustreFileSystemLogConfiguration.Jsii$Proxy.class)
public interface FsxLustreFileSystemLogConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#destination FsxLustreFileSystem#destination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#level FsxLustreFileSystem#level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxLustreFileSystemLogConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxLustreFileSystemLogConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxLustreFileSystemLogConfiguration> {
        java.lang.String destination;
        java.lang.String level;

        /**
         * Sets the value of {@link FsxLustreFileSystemLogConfiguration#getDestination}
         * @param destination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#destination FsxLustreFileSystem#destination}.
         * @return {@code this}
         */
        public Builder destination(java.lang.String destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemLogConfiguration#getLevel}
         * @param level Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#level FsxLustreFileSystem#level}.
         * @return {@code this}
         */
        public Builder level(java.lang.String level) {
            this.level = level;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxLustreFileSystemLogConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxLustreFileSystemLogConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxLustreFileSystemLogConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxLustreFileSystemLogConfiguration {
        private final java.lang.String destination;
        private final java.lang.String level;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.level = software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = builder.destination;
            this.level = builder.level;
        }

        @Override
        public final java.lang.String getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getLevel() {
            return this.level;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDestination() != null) {
                data.set("destination", om.valueToTree(this.getDestination()));
            }
            if (this.getLevel() != null) {
                data.set("level", om.valueToTree(this.getLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxLustreFileSystem.FsxLustreFileSystemLogConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxLustreFileSystemLogConfiguration.Jsii$Proxy that = (FsxLustreFileSystemLogConfiguration.Jsii$Proxy) o;

            if (this.destination != null ? !this.destination.equals(that.destination) : that.destination != null) return false;
            return this.level != null ? this.level.equals(that.level) : that.level == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination != null ? this.destination.hashCode() : 0;
            result = 31 * result + (this.level != null ? this.level.hashCode() : 0);
            return result;
        }
    }
}
