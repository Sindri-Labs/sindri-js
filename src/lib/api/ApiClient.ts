/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { AxiosHttpRequest } from './core/AxiosHttpRequest';

import { AuthorizationService } from './services/AuthorizationService';
import { CircuitsService } from './services/CircuitsService';
import { InternalService } from './services/InternalService';
import { ProofsService } from './services/ProofsService';
import { TokenService } from './services/TokenService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class ApiClient {

    public readonly authorization: AuthorizationService;
    public readonly circuits: CircuitsService;
    public readonly internal: InternalService;
    public readonly proofs: ProofsService;
    public readonly token: TokenService;

    public readonly request: BaseHttpRequest;

    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = AxiosHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'https://sindri.app',
            VERSION: config?.VERSION ?? '1.6.14',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });

        this.authorization = new AuthorizationService(this.request);
        this.circuits = new CircuitsService(this.request);
        this.internal = new InternalService(this.request);
        this.proofs = new ProofsService(this.request);
        this.token = new TokenService(this.request);
    }
}

