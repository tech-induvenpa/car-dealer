import { ArgumentsHost } from '@nestjs/common';
import { DomainException } from '../domain/domain.exception';
import { DomainExceptionFilter } from './domain-exception.filter';

class TestDomainException extends DomainException {
  constructor() {
    super('algo salió mal en el dominio');
  }
}

class TestNotFoundException extends DomainException {
  readonly httpStatus = 404;
  constructor() {
    super('no encontrado');
  }
}

function mockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  it('maps a DomainException to a 400 with the exception message', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = mockHost();

    filter.catch(new TestDomainException(), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'algo salió mal en el dominio',
    });
  });

  it('respects a subclass-defined httpStatus (e.g. 404)', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = mockHost();

    filter.catch(new TestNotFoundException(), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'Not Found',
      message: 'no encontrado',
    });
  });
});
