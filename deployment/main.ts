import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import config from 'config';
import { KubeNamespace, KubeSecret, Quantity, ResourceRequirements } from './imports/k8s';
import { WebService } from './imports/WebService';

const nodeEnv = process.env.NODE_ENV;
const registry = config.get<string>('docker.registry');
const { namespace, imageLabel, labels } = config.get<any>('webService');
const apmSecretToken = config.get<string>('apm.secretToken');
const slackToken = config.get<string>('slackToken');
const scbUser = process.env.SCB_USER;
const scbPass = process.env.SCB_PASS;
const platformURL = process.env.SCB_PLATFORM_URL;
const gitlabRegToken = config.get<string>('gitlabK8sRegToken');

const resCfg = (key:string) => config.get<string>(`webService.deployment.resources.${key}`);

const resources: ResourceRequirements = {
  requests: {
    cpu: Quantity.fromString(resCfg('requests.cpu')),
    memory: Quantity.fromString(resCfg('requests.memory'))
  },
  limits: {
    cpu: Quantity.fromString(resCfg('limits.cpu')),
    memory: Quantity.fromString(resCfg('limits.memory'))
  }
};

export class Deployment extends Chart {
  private imagePullSecretName = 'regcred';
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, { ...props, namespace });

    new KubeNamespace(this, 'namespace', {
      metadata: {
        name: namespace,
        labels: {
          'istio-injection': 'disabled',
        },
      },
    });

    const authEnv = (scbPass && scbPass) ? [{ name: 'SCB_USER', value: scbUser }, { name: 'SCB_PASS', value: scbPass }] : [];
    const platformEnv = platformURL ? [{ name: 'SCB_PLATFORM_URL', value: platformURL }] : [];

    new KubeSecret(this, 'secret', {
      metadata: { name: this.imagePullSecretName },
      type: 'kubernetes.io/dockerconfigjson',
      stringData: {
        '.dockerconfigjson' : `{"auths":{"registry.gitlab.com":{"auth":"${Buffer.from(`gitlab-ci:${gitlabRegToken}`).toString('base64')}"}}}`
      }
    });

    new WebService(this, 'sfdc-integration', {
      namespace,
      name: 'sfdc-integration',
      image: `${registry}/sfdc-integration:${imageLabel}`,
      imagePullSecretName: this.imagePullSecretName,
      portName: 'http',
      port: 80,
      containerPort: 3000,
      env: [
        { name: 'APM_SERVERURL', value: 'https://73bb7e3b291c4633941581ac815d1da0.apm.ca-central-1.aws.elastic-cloud.com:443' },
        { name: 'APM_SECRETTOKEN', value: apmSecretToken },
        { name: 'SLACK_TOKEN', value: slackToken },
        { name: 'NODE_ENV', value: nodeEnv },
        ...authEnv,
        ...platformEnv,
      ],
      resources,
      labels,
    });
  }
}

const app = new App();
new Deployment(app, 'deployment');
app.synth();
