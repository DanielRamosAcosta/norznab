import {
  TorznabErrorCode,
  type TorznabErrorCodeValue,
} from "./TorznabErrorCode.ts";

export class ApiError extends Error {
  public readonly code: TorznabErrorCodeValue;

  constructor(code: TorznabErrorCodeValue, message: string) {
    super(message);
    this.code = code;
  }
}

export class FunctionNotAvailable extends ApiError {
  constructor(unknownFunction: string) {
    super(
      TorznabErrorCode.FUNCTION_NOT_AVAILABLE,
      `Invalid function: ${unknownFunction}`,
    );
  }
}
