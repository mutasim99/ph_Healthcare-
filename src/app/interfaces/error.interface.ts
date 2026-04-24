export interface TErrorInterface {
  path: string;
  message: string;
}

export interface TErrorResponse {
  statusCode?: number;
  success: boolean;
  message: string;
  errorSources: TErrorInterface[];
  stack?:string;
  error?: unknown;
}
