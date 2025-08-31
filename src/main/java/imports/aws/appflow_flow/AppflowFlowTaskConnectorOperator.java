package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTaskConnectorOperator")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowTaskConnectorOperator.Jsii$Proxy.class)
public interface AppflowFlowTaskConnectorOperator extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#amplitude AppflowFlow#amplitude}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmplitude() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#custom_connector AppflowFlow#custom_connector}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomConnector() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#datadog AppflowFlow#datadog}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatadog() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#dynatrace AppflowFlow#dynatrace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDynatrace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#google_analytics AppflowFlow#google_analytics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGoogleAnalytics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#infor_nexus AppflowFlow#infor_nexus}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInforNexus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#marketo AppflowFlow#marketo}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMarketo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#s3 AppflowFlow#s3}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#salesforce AppflowFlow#salesforce}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSalesforce() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#sapo_data AppflowFlow#sapo_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSapoData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#service_now AppflowFlow#service_now}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceNow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#singular AppflowFlow#singular}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSingular() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#slack AppflowFlow#slack}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSlack() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trendmicro AppflowFlow#trendmicro}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTrendmicro() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#veeva AppflowFlow#veeva}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVeeva() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#zendesk AppflowFlow#zendesk}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getZendesk() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowTaskConnectorOperator}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowTaskConnectorOperator}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowTaskConnectorOperator> {
        java.lang.String amplitude;
        java.lang.String customConnector;
        java.lang.String datadog;
        java.lang.String dynatrace;
        java.lang.String googleAnalytics;
        java.lang.String inforNexus;
        java.lang.String marketo;
        java.lang.String s3;
        java.lang.String salesforce;
        java.lang.String sapoData;
        java.lang.String serviceNow;
        java.lang.String singular;
        java.lang.String slack;
        java.lang.String trendmicro;
        java.lang.String veeva;
        java.lang.String zendesk;

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getAmplitude}
         * @param amplitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#amplitude AppflowFlow#amplitude}.
         * @return {@code this}
         */
        public Builder amplitude(java.lang.String amplitude) {
            this.amplitude = amplitude;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getCustomConnector}
         * @param customConnector Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#custom_connector AppflowFlow#custom_connector}.
         * @return {@code this}
         */
        public Builder customConnector(java.lang.String customConnector) {
            this.customConnector = customConnector;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getDatadog}
         * @param datadog Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#datadog AppflowFlow#datadog}.
         * @return {@code this}
         */
        public Builder datadog(java.lang.String datadog) {
            this.datadog = datadog;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getDynatrace}
         * @param dynatrace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#dynatrace AppflowFlow#dynatrace}.
         * @return {@code this}
         */
        public Builder dynatrace(java.lang.String dynatrace) {
            this.dynatrace = dynatrace;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getGoogleAnalytics}
         * @param googleAnalytics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#google_analytics AppflowFlow#google_analytics}.
         * @return {@code this}
         */
        public Builder googleAnalytics(java.lang.String googleAnalytics) {
            this.googleAnalytics = googleAnalytics;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getInforNexus}
         * @param inforNexus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#infor_nexus AppflowFlow#infor_nexus}.
         * @return {@code this}
         */
        public Builder inforNexus(java.lang.String inforNexus) {
            this.inforNexus = inforNexus;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getMarketo}
         * @param marketo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#marketo AppflowFlow#marketo}.
         * @return {@code this}
         */
        public Builder marketo(java.lang.String marketo) {
            this.marketo = marketo;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getS3}
         * @param s3 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#s3 AppflowFlow#s3}.
         * @return {@code this}
         */
        public Builder s3(java.lang.String s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getSalesforce}
         * @param salesforce Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#salesforce AppflowFlow#salesforce}.
         * @return {@code this}
         */
        public Builder salesforce(java.lang.String salesforce) {
            this.salesforce = salesforce;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getSapoData}
         * @param sapoData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#sapo_data AppflowFlow#sapo_data}.
         * @return {@code this}
         */
        public Builder sapoData(java.lang.String sapoData) {
            this.sapoData = sapoData;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getServiceNow}
         * @param serviceNow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#service_now AppflowFlow#service_now}.
         * @return {@code this}
         */
        public Builder serviceNow(java.lang.String serviceNow) {
            this.serviceNow = serviceNow;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getSingular}
         * @param singular Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#singular AppflowFlow#singular}.
         * @return {@code this}
         */
        public Builder singular(java.lang.String singular) {
            this.singular = singular;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getSlack}
         * @param slack Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#slack AppflowFlow#slack}.
         * @return {@code this}
         */
        public Builder slack(java.lang.String slack) {
            this.slack = slack;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getTrendmicro}
         * @param trendmicro Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trendmicro AppflowFlow#trendmicro}.
         * @return {@code this}
         */
        public Builder trendmicro(java.lang.String trendmicro) {
            this.trendmicro = trendmicro;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getVeeva}
         * @param veeva Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#veeva AppflowFlow#veeva}.
         * @return {@code this}
         */
        public Builder veeva(java.lang.String veeva) {
            this.veeva = veeva;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTaskConnectorOperator#getZendesk}
         * @param zendesk Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#zendesk AppflowFlow#zendesk}.
         * @return {@code this}
         */
        public Builder zendesk(java.lang.String zendesk) {
            this.zendesk = zendesk;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowTaskConnectorOperator}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowTaskConnectorOperator build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowTaskConnectorOperator}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowTaskConnectorOperator {
        private final java.lang.String amplitude;
        private final java.lang.String customConnector;
        private final java.lang.String datadog;
        private final java.lang.String dynatrace;
        private final java.lang.String googleAnalytics;
        private final java.lang.String inforNexus;
        private final java.lang.String marketo;
        private final java.lang.String s3;
        private final java.lang.String salesforce;
        private final java.lang.String sapoData;
        private final java.lang.String serviceNow;
        private final java.lang.String singular;
        private final java.lang.String slack;
        private final java.lang.String trendmicro;
        private final java.lang.String veeva;
        private final java.lang.String zendesk;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amplitude = software.amazon.jsii.Kernel.get(this, "amplitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customConnector = software.amazon.jsii.Kernel.get(this, "customConnector", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.datadog = software.amazon.jsii.Kernel.get(this, "datadog", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dynatrace = software.amazon.jsii.Kernel.get(this, "dynatrace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.googleAnalytics = software.amazon.jsii.Kernel.get(this, "googleAnalytics", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inforNexus = software.amazon.jsii.Kernel.get(this, "inforNexus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.marketo = software.amazon.jsii.Kernel.get(this, "marketo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3 = software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.salesforce = software.amazon.jsii.Kernel.get(this, "salesforce", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sapoData = software.amazon.jsii.Kernel.get(this, "sapoData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceNow = software.amazon.jsii.Kernel.get(this, "serviceNow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.singular = software.amazon.jsii.Kernel.get(this, "singular", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slack = software.amazon.jsii.Kernel.get(this, "slack", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trendmicro = software.amazon.jsii.Kernel.get(this, "trendmicro", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.veeva = software.amazon.jsii.Kernel.get(this, "veeva", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.zendesk = software.amazon.jsii.Kernel.get(this, "zendesk", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amplitude = builder.amplitude;
            this.customConnector = builder.customConnector;
            this.datadog = builder.datadog;
            this.dynatrace = builder.dynatrace;
            this.googleAnalytics = builder.googleAnalytics;
            this.inforNexus = builder.inforNexus;
            this.marketo = builder.marketo;
            this.s3 = builder.s3;
            this.salesforce = builder.salesforce;
            this.sapoData = builder.sapoData;
            this.serviceNow = builder.serviceNow;
            this.singular = builder.singular;
            this.slack = builder.slack;
            this.trendmicro = builder.trendmicro;
            this.veeva = builder.veeva;
            this.zendesk = builder.zendesk;
        }

        @Override
        public final java.lang.String getAmplitude() {
            return this.amplitude;
        }

        @Override
        public final java.lang.String getCustomConnector() {
            return this.customConnector;
        }

        @Override
        public final java.lang.String getDatadog() {
            return this.datadog;
        }

        @Override
        public final java.lang.String getDynatrace() {
            return this.dynatrace;
        }

        @Override
        public final java.lang.String getGoogleAnalytics() {
            return this.googleAnalytics;
        }

        @Override
        public final java.lang.String getInforNexus() {
            return this.inforNexus;
        }

        @Override
        public final java.lang.String getMarketo() {
            return this.marketo;
        }

        @Override
        public final java.lang.String getS3() {
            return this.s3;
        }

        @Override
        public final java.lang.String getSalesforce() {
            return this.salesforce;
        }

        @Override
        public final java.lang.String getSapoData() {
            return this.sapoData;
        }

        @Override
        public final java.lang.String getServiceNow() {
            return this.serviceNow;
        }

        @Override
        public final java.lang.String getSingular() {
            return this.singular;
        }

        @Override
        public final java.lang.String getSlack() {
            return this.slack;
        }

        @Override
        public final java.lang.String getTrendmicro() {
            return this.trendmicro;
        }

        @Override
        public final java.lang.String getVeeva() {
            return this.veeva;
        }

        @Override
        public final java.lang.String getZendesk() {
            return this.zendesk;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmplitude() != null) {
                data.set("amplitude", om.valueToTree(this.getAmplitude()));
            }
            if (this.getCustomConnector() != null) {
                data.set("customConnector", om.valueToTree(this.getCustomConnector()));
            }
            if (this.getDatadog() != null) {
                data.set("datadog", om.valueToTree(this.getDatadog()));
            }
            if (this.getDynatrace() != null) {
                data.set("dynatrace", om.valueToTree(this.getDynatrace()));
            }
            if (this.getGoogleAnalytics() != null) {
                data.set("googleAnalytics", om.valueToTree(this.getGoogleAnalytics()));
            }
            if (this.getInforNexus() != null) {
                data.set("inforNexus", om.valueToTree(this.getInforNexus()));
            }
            if (this.getMarketo() != null) {
                data.set("marketo", om.valueToTree(this.getMarketo()));
            }
            if (this.getS3() != null) {
                data.set("s3", om.valueToTree(this.getS3()));
            }
            if (this.getSalesforce() != null) {
                data.set("salesforce", om.valueToTree(this.getSalesforce()));
            }
            if (this.getSapoData() != null) {
                data.set("sapoData", om.valueToTree(this.getSapoData()));
            }
            if (this.getServiceNow() != null) {
                data.set("serviceNow", om.valueToTree(this.getServiceNow()));
            }
            if (this.getSingular() != null) {
                data.set("singular", om.valueToTree(this.getSingular()));
            }
            if (this.getSlack() != null) {
                data.set("slack", om.valueToTree(this.getSlack()));
            }
            if (this.getTrendmicro() != null) {
                data.set("trendmicro", om.valueToTree(this.getTrendmicro()));
            }
            if (this.getVeeva() != null) {
                data.set("veeva", om.valueToTree(this.getVeeva()));
            }
            if (this.getZendesk() != null) {
                data.set("zendesk", om.valueToTree(this.getZendesk()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowTaskConnectorOperator"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowTaskConnectorOperator.Jsii$Proxy that = (AppflowFlowTaskConnectorOperator.Jsii$Proxy) o;

            if (this.amplitude != null ? !this.amplitude.equals(that.amplitude) : that.amplitude != null) return false;
            if (this.customConnector != null ? !this.customConnector.equals(that.customConnector) : that.customConnector != null) return false;
            if (this.datadog != null ? !this.datadog.equals(that.datadog) : that.datadog != null) return false;
            if (this.dynatrace != null ? !this.dynatrace.equals(that.dynatrace) : that.dynatrace != null) return false;
            if (this.googleAnalytics != null ? !this.googleAnalytics.equals(that.googleAnalytics) : that.googleAnalytics != null) return false;
            if (this.inforNexus != null ? !this.inforNexus.equals(that.inforNexus) : that.inforNexus != null) return false;
            if (this.marketo != null ? !this.marketo.equals(that.marketo) : that.marketo != null) return false;
            if (this.s3 != null ? !this.s3.equals(that.s3) : that.s3 != null) return false;
            if (this.salesforce != null ? !this.salesforce.equals(that.salesforce) : that.salesforce != null) return false;
            if (this.sapoData != null ? !this.sapoData.equals(that.sapoData) : that.sapoData != null) return false;
            if (this.serviceNow != null ? !this.serviceNow.equals(that.serviceNow) : that.serviceNow != null) return false;
            if (this.singular != null ? !this.singular.equals(that.singular) : that.singular != null) return false;
            if (this.slack != null ? !this.slack.equals(that.slack) : that.slack != null) return false;
            if (this.trendmicro != null ? !this.trendmicro.equals(that.trendmicro) : that.trendmicro != null) return false;
            if (this.veeva != null ? !this.veeva.equals(that.veeva) : that.veeva != null) return false;
            return this.zendesk != null ? this.zendesk.equals(that.zendesk) : that.zendesk == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amplitude != null ? this.amplitude.hashCode() : 0;
            result = 31 * result + (this.customConnector != null ? this.customConnector.hashCode() : 0);
            result = 31 * result + (this.datadog != null ? this.datadog.hashCode() : 0);
            result = 31 * result + (this.dynatrace != null ? this.dynatrace.hashCode() : 0);
            result = 31 * result + (this.googleAnalytics != null ? this.googleAnalytics.hashCode() : 0);
            result = 31 * result + (this.inforNexus != null ? this.inforNexus.hashCode() : 0);
            result = 31 * result + (this.marketo != null ? this.marketo.hashCode() : 0);
            result = 31 * result + (this.s3 != null ? this.s3.hashCode() : 0);
            result = 31 * result + (this.salesforce != null ? this.salesforce.hashCode() : 0);
            result = 31 * result + (this.sapoData != null ? this.sapoData.hashCode() : 0);
            result = 31 * result + (this.serviceNow != null ? this.serviceNow.hashCode() : 0);
            result = 31 * result + (this.singular != null ? this.singular.hashCode() : 0);
            result = 31 * result + (this.slack != null ? this.slack.hashCode() : 0);
            result = 31 * result + (this.trendmicro != null ? this.trendmicro.hashCode() : 0);
            result = 31 * result + (this.veeva != null ? this.veeva.hashCode() : 0);
            result = 31 * result + (this.zendesk != null ? this.zendesk.hashCode() : 0);
            return result;
        }
    }
}
