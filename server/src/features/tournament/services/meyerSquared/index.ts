import { IM2Service } from './IM2Service';
import { M2ServiceLive } from './M2ServiceLive';
import { M2ServiceStub } from './M2ServiceStub';
import { env } from '../../../../config/env';

export function createM2Service(): IM2Service {
  if (env.NODE_ENV === 'test' || env.USE_M2_STUB) {
    console.log('Using M2 stub service');
    return new M2ServiceStub();
  }
  console.log('Using M2 live service');
  return new M2ServiceLive();
}

let m2Service: IM2Service | null = null;

export function getM2Service(): IM2Service {
  if (!m2Service) {
    m2Service = createM2Service();
  }
  return m2Service;
}

export function setM2Service(service: IM2Service): void {
  m2Service = service;
}

export { IM2Service, M2AddPersonData } from './IM2Service';
export { M2ServiceLive } from './M2ServiceLive';
export { M2ServiceStub } from './M2ServiceStub';
