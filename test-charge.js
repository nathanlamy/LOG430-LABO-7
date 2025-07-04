import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1000,
  duration: '10s',
};

export default function () {
  const res = http.get('http://10.194.32.204:8080/produits');
  //const res = http.get('http://10.194.32.204:3001/produits');
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
