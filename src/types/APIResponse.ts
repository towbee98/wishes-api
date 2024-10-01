export class APIResponse<T> {
  data: T;
  constructor(data: T) {
    this.data = data;
  }
}
