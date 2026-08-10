/** Thrown by every stub below. Live YouCam integration is Task 2's scope. */
export class YouCamNotImplementedError extends Error {
  constructor(message = "Live YouCam integration is not implemented in this build.") {
    super(message);
    this.name = "YouCamNotImplementedError";
  }
}
