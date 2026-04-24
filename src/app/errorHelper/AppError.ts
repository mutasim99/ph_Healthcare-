class AppError extends Error {
  public StatusCode: number;

  constructor( statusCode: number, message: string,stack= "") {
    super(message);
    this.StatusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError
