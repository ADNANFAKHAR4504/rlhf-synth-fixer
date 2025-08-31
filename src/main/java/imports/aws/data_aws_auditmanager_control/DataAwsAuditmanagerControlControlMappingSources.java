package imports.aws.data_aws_auditmanager_control;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.459Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAuditmanagerControl.DataAwsAuditmanagerControlControlMappingSources")
@software.amazon.jsii.Jsii.Proxy(DataAwsAuditmanagerControlControlMappingSources.Jsii$Proxy.class)
public interface DataAwsAuditmanagerControlControlMappingSources extends software.amazon.jsii.JsiiSerializable {

    /**
     * source_keyword block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/auditmanager_control#source_keyword DataAwsAuditmanagerControl#source_keyword}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceKeyword() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsAuditmanagerControlControlMappingSources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsAuditmanagerControlControlMappingSources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsAuditmanagerControlControlMappingSources> {
        java.lang.Object sourceKeyword;

        /**
         * Sets the value of {@link DataAwsAuditmanagerControlControlMappingSources#getSourceKeyword}
         * @param sourceKeyword source_keyword block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/auditmanager_control#source_keyword DataAwsAuditmanagerControl#source_keyword}
         * @return {@code this}
         */
        public Builder sourceKeyword(com.hashicorp.cdktf.IResolvable sourceKeyword) {
            this.sourceKeyword = sourceKeyword;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAuditmanagerControlControlMappingSources#getSourceKeyword}
         * @param sourceKeyword source_keyword block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/auditmanager_control#source_keyword DataAwsAuditmanagerControl#source_keyword}
         * @return {@code this}
         */
        public Builder sourceKeyword(java.util.List<? extends imports.aws.data_aws_auditmanager_control.DataAwsAuditmanagerControlControlMappingSourcesSourceKeyword> sourceKeyword) {
            this.sourceKeyword = sourceKeyword;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsAuditmanagerControlControlMappingSources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsAuditmanagerControlControlMappingSources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsAuditmanagerControlControlMappingSources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsAuditmanagerControlControlMappingSources {
        private final java.lang.Object sourceKeyword;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceKeyword = software.amazon.jsii.Kernel.get(this, "sourceKeyword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceKeyword = builder.sourceKeyword;
        }

        @Override
        public final java.lang.Object getSourceKeyword() {
            return this.sourceKeyword;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSourceKeyword() != null) {
                data.set("sourceKeyword", om.valueToTree(this.getSourceKeyword()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsAuditmanagerControl.DataAwsAuditmanagerControlControlMappingSources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsAuditmanagerControlControlMappingSources.Jsii$Proxy that = (DataAwsAuditmanagerControlControlMappingSources.Jsii$Proxy) o;

            return this.sourceKeyword != null ? this.sourceKeyword.equals(that.sourceKeyword) : that.sourceKeyword == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceKeyword != null ? this.sourceKeyword.hashCode() : 0;
            return result;
        }
    }
}
