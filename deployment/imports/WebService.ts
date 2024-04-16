import { Construct } from 'constructs';
import { Names } from 'cdk8s';
import {
  KubeDeployment,
  KubeService,
  Probe,
  EnvVar,
  ResourceRequirements,
  EnvFromSource,
  IntOrString,
} from './k8s';

export interface WebServiceProps {
  /**
   * Name of the web service. Makes things easier to read.
   */
  readonly name: string;

  /**
   * Namespace to deploy the web service into. Defaults to 'default'
   */
  readonly namespace?: string;

  /**
   * The Docker image to use for this service.
   */
  readonly image: string;

  /**
   * Minimum umber of replicas.
   *
   * @default 1
   */
  readonly minReplicas?: number;

  /**
   * Maximum umber of replicas.
   *
   * @default 1
   */
  readonly maxReplicas?: number;

  /**
   * External port.
   *
   * @default 80
   */
  readonly port?: number;

  /**
   * Internal port.
   *
   * @default 8080
   */
  readonly containerPort?: number;

  /**
   * Arguments to the entrypoint. The docker image's CMD is used if this is not provided. Variable references $(VAR_NAME) are expanded using the container's environment. If a variable cannot be resolved, the reference in the input string will be unchanged. The $(VAR_NAME) syntax can be escaped with a double $$, ie: $$(VAR_NAME). Escaped references will never be expanded, regardless of whether the variable exists or not. Cannot be updated.
   *
   * @default []
   */
  readonly args?: string[];

  /**
   * Environmental variables to pass into docker.
   *
   * @default []
   */
  readonly env?: EnvVar[];

  /**
   * Environmental variables to pass into docker.
   *
   * @default []
   */
  readonly envFrom?: EnvFromSource[];

  /**
   * Periodic probe of container service readiness. Container will be removed from service endpoints if the probe fails. Cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
   */
  readonly readinessProbe?: Probe;

  /**
   * Periodic probe of container liveness. Container will be restarted if the probe fails. Cannot be updated. More info: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle#container-probes
   */
  readonly livenessProbe?: Probe;

  /**
   * Annotations is an unstructured key value map stored with a resource that may be set by external tools to store and retrieve arbitrary metadata. They are not queryable and should be preserved when modifying objects. More info: http://kubernetes.io/docs/user-guide/annotations
   */
  readonly annotations?: { [key: string]: string };

  /**
   * Labels are key/value pairs that are attached to objects, such as pods. Labels are intended to be used to specify identifying attributes of objects that are meaningful and relevant to users, but do not directly imply semantics to the core system. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
   */
   readonly labels?: { [key: string]: string };

  /**
   * Resource requirements describes the compute resource requirements
   */
  readonly resources: ResourceRequirements;

  /**
   * Provision an Istio Gateway (to allow external traffic) for the Service. More info: https://istio.io/latest/docs/reference/config/networking/gateway/
   */
  readonly provisionGateway?: boolean;

  /**
   * Port name configuration for Flagger canary resource, set to "grpc" for gRPC services. More info: https://docs.flagger.app/usage/how-it-works#canary-service
   */
  readonly portName?: string;

  /**
   * domain name for the gateway
   */
  readonly domainName?: string;

  /**
   * Docker image pull secret auth, basically base64 encoded "username:password" for docker registry
   */
  readonly imagePullSecretName?: string;
}

export class WebService extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceProps) {
    super(scope, id);

    const port = props.port || 80;
    const containerPort = props.containerPort || 8080;
    const label = { app: Names.toDnsLabel(this) };
    const labels = { ...props.labels, ...label };
    const args = props.args ?? [];
    const env = props.env;
    const envFrom = props.envFrom;
    const {
      image,
      name,
      annotations,
      resources,
      livenessProbe,
      readinessProbe,
    } = props;

    new KubeDeployment(this, 'deployment', {
      metadata: {
        name: id,
        labels
      },
      spec: {
        selector: {
          matchLabels: label,
        },
        template: {
          metadata: { labels, name: id, annotations },
          spec: {
            containers: [
              {
                name,
                image,
                ports: [{ containerPort }],
                args,
                imagePullPolicy: 'Always',
                readinessProbe,
                livenessProbe,
                resources,
                env,
                envFrom,
              },
            ],
            imagePullSecrets: [{ name: props.imagePullSecretName }],
          },
        },
      },
    });

    new KubeService(this, 'service', {
      metadata: {
        name: id,
        labels
      },
      spec: {
        ports: [{ port, targetPort: IntOrString.fromNumber(containerPort), name: `${port}-${containerPort}` }],
        selector: label,
        type: 'LoadBalancer'
      },
    });
  }
}
