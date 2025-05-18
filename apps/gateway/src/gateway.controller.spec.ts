import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('GatewayController', () => {
  let gatewayController: GatewayController;
  let authClientMock: ClientProxy;
  let eventClientMock: ClientProxy;

  beforeEach(async () => {
    const mockClientProxy = {
      send: jest.fn().mockImplementation(() => of({ status: 'ok' }))
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        {
          provide: 'AUTH_SERVICE',
          useValue: mockClientProxy,
        },
        {
          provide: 'EVENT_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    gatewayController = app.get<GatewayController>(GatewayController);
    authClientMock = app.get<ClientProxy>('AUTH_SERVICE');
    eventClientMock = app.get<ClientProxy>('EVENT_SERVICE');
  });

  it('should be defined', () => {
    expect(gatewayController).toBeDefined();
  });

  it('should check auth health', async () => {
    const result = { status: 'ok' };
    jest.spyOn(authClientMock, 'send').mockImplementationOnce(() => of(result));
    
    expect(await gatewayController.checkAuthHealth()).toEqual(result);
    expect(authClientMock.send).toHaveBeenCalledWith({ cmd: 'health' }, {});
  });

  it('should check event health', async () => {
    const result = { status: 'ok' };
    jest.spyOn(eventClientMock, 'send').mockImplementationOnce(() => of(result));
    
    expect(await gatewayController.checkEventHealth()).toEqual(result);
    expect(eventClientMock.send).toHaveBeenCalledWith({ cmd: 'health' }, {});
  });
});
