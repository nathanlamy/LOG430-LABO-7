import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total') private counter: Counter,
    @InjectMetric('http_request_duration_seconds') private histogram: Histogram,

    @InjectMetric('saga_started_total') private sagaStarted: Counter,
    @InjectMetric('saga_succeeded_total') private sagaSucceeded: Counter,
    @InjectMetric('saga_failed_total') private sagaFailed: Counter,
    @InjectMetric('saga_duration_seconds') private sagaDuration: Histogram,
    @InjectMetric('saga_step_total') private sagaStep: Counter,
    @InjectMetric('saga_in_flight') private sagaInFlight: Gauge,

    // (optionnel) externes
    @InjectMetric('saga_external_call_duration_seconds')
    private extDur: Histogram,
  ) {}

  trackRequest(method: string, route: string, status_code: number, duration: number) {
    this.counter.inc({ method, route, status_code });
    this.histogram.observe({ method, route, status_code }, duration);
  }

    startSagaTimer() {
    this.sagaStarted.inc();
    this.sagaInFlight.inc();
    return this.sagaDuration.startTimer(); // renvoie () => void
  }
  endSagaSuccess(stopTimer: () => void) {
    stopTimer();
    this.sagaSucceeded.inc();
    this.sagaInFlight.dec();
  }
  endSagaFail(stopTimer: () => void) {
    stopTimer();
    this.sagaFailed.inc();
    this.sagaInFlight.dec();
  }
  step(step: string, outcome: 'ok' | 'ko') {
    this.sagaStep.inc({ step, outcome });
  }

  // ==== (optionnel) mesure d’un appel externe ====
  async measureExternal<T>(
    target: 'stock' | 'produits' | 'ventes',
    phase: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const stop = this.extDur.startTimer({ target, phase });
    try {
      const out = await fn();
      stop({ target, phase, outcome: 'ok' });
      return out;
    } catch (e) {
      stop({ target, phase, outcome: 'ko' });
      throw e;
    }
  }
}
