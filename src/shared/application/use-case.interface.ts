export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest, ...args: unknown[]): Promise<TResponse>;
}
