import {
  makeCounterProvider,
  makeHistogramProvider, makeGaugeProvider
} from '@willsoto/nestjs-prometheus';

export const MetricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5], // à ajuster
  }),

  makeCounterProvider({
    name: 'saga_started_total',
    help: 'Nombre de sagas démarrées',
  }),
  makeCounterProvider({
    name: 'saga_succeeded_total',
    help: 'Nombre de sagas terminées avec succès',
  }),
  makeCounterProvider({
    name: 'saga_failed_total',
    help: 'Nombre de sagas terminées en échec',
  }),
  makeHistogramProvider({
    name: 'saga_duration_seconds',
    help: 'Durée des sagas (du POST /commandes au résultat)',
    buckets: [0.1, 0.3, 0.5, 1, 2, 3, 5, 8, 13],
  }),
  makeCounterProvider({
    name: 'saga_step_total',
    help: 'Compteur d’étapes de saga par résultat',
    labelNames: ['step', 'outcome'], // step = STOCK_CHECK|VENTE_CREATE|COMP_DELETE_VENTE|COMP_REAPPRO, outcome = ok|ko
  }),

  // ====== (OPTIONNEL) appels externes par cible/phase ======
  makeHistogramProvider({
    name: 'saga_external_call_duration_seconds',
    help: 'Durée des appels externes effectués par la saga',
    labelNames: ['target', 'phase', 'outcome'], // target=stock|produits|ventes, phase=check|reserve|create|delete|reappro
    buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 3],
  }),

  makeGaugeProvider({
    name: 'saga_in_flight',
    help: 'Sagas en cours (non terminées)',
  }),

  makeCounterProvider({
    name: 'events_published_total',
    help: 'Nombre total d’événements publiés',
    labelNames: ['event_type', 'stream'],
  }),

  makeHistogramProvider({
    name: 'event_latency_seconds',
    help: 'Temps entre l’émission et la consommation de l’événement',
    labelNames: ['event_type', 'stream'],
    buckets: [0.01, 0.1, 0.5, 1, 2, 3, 5],
  }),

  makeCounterProvider({
    name: 'event_consumed_total',
    help: 'Nombre total d’événements consommés',
    labelNames: ['event_type', 'stream'],
  }),

  makeCounterProvider({
    name: 'commande_events_emitted_total',
    help: 'Nombre total d’événements commande émis',
    labelNames: ['type'],
  }),
];
