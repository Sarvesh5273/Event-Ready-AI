/** Thrown when a YouCam call is attempted without `YOUCAM_API_KEY` configured. */
export class YouCamNotConfiguredError extends Error {
  constructor(message = "YOUCAM_API_KEY is not configured — Live Mode is unavailable.") {
    super(message);
    this.name = "YouCamNotConfiguredError";
  }
}

/** Thrown when the YouCam API itself returns a non-2xx response. */
export class YouCamApiError extends Error {
  readonly status: number;
  readonly errorCode: string | undefined;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "YouCamApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

export type YouCamTaskStatus = "running" | "success" | "error";
