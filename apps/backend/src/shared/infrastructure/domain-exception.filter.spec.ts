import { ArgumentsHost } from '@nestjs/common';
import { DomainException } from '../domain/domain.exception';
import { DomainExceptionFilter } from './domain-exception.filter';

class TestDomainException extends DomainException {
  constructor() {
    super('algo salió mal en el dominio');
  }
}

describe('DomainExceptionFilter', () => {
  it('maps a DomainException to a 400 with the exception message', () => {
    const filter = new DomainExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    filter.catch(new TestDomainException(), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'algo salió mal en el dominio',
    });
  });
});
