import { EventEmitter } from "events";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface WSRekanetOptions {
  /** # of times to reconnect within a retry */
  maxReconnectAttempts?: number;
  /** # of attempts at reconnecting */
  maxRetryAttempts?: number;
  /** Whether to store 'send' data when connection is broken  */
  useMessageQueue?: boolean;
  /** whether to disable reconnection */
  disableReconnect?: boolean;
  /** enable to get console.log output */
  debugMode?: boolean;
}
// websocket with reconnection on exponential back-off
export default class WSRekanet extends EventEmitter {
  private ws: WebSocket;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private retryAttempts: number;
  private maxRetryAttempts: number;
  private intervalRef: number;
  private messageQueue: Array<string | Blob | ArrayBuffer | ArrayBufferView>;
  private useMessageQueue: boolean;
  private forcedClose: boolean;
  private disableReconnect: boolean;

  constructor(
    url: string | URL,
    private protocols: string | string[] = [],
    options?: WSRekanetOptions
  ) {
    super();

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options?.maxReconnectAttempts ?? 5;
    this.intervalRef = 0;
    this.messageQueue = [];
    this.retryAttempts = 0;
    this.maxRetryAttempts = options?.maxRetryAttempts ?? 5;
    this.forcedClose = false;
    this.useMessageQueue = options?.useMessageQueue ?? true;
    this.disableReconnect = options?.disableReconnect ?? false;

    if (!options?.debugMode) {
      console.log = () => {};
    }

    this.ws = new window.WebSocket(url, protocols);
    this.connect();
  }

  private onOpen = () => {
    this.emit("open");
    this.forcedClose = false;
  };

  private onMessage = (event: MessageEvent<any>) => {
    this.emit("message", event);
  };

  private onError = (error: Event) => {
    this.emit("error", error);
    this.reconnect();
  };

  private onClose = () => {
    if (!this.forcedClose) {
      this.emit("close");
      this.reconnect();
    }
  };

  public send: WebSocket["send"] = (
    data: string | Blob | ArrayBuffer | ArrayBufferView
  ) => {
    if (this.isOpen()) {
      this.ws.send(data);
    } else if (this.useMessageQueue) {
      this.messageQueue.push(data);
    }
  };

  public close: WebSocket["close"] = (code?: number, reason?: string) => {
    this.forcedClose = true;
    this.ws.close(code, reason);
  };

  private connect = async () => {
    this.ws.onclose = this.onClose;
    this.ws.onerror = this.onError;
    this.ws.onopen = this.onOpen;
    this.ws.onmessage = this.onMessage;

    if (this.useMessageQueue) {
      this.relayQueuedMessages();
    }
  };

  /** relay messages that were queued while the connection was closed */
  private relayQueuedMessages = async () => {
    const messageQueue = [...this.messageQueue];
    for (const msg of messageQueue) {
      await wait(100);
      this.ws.send(msg);
    }

    this.messageQueue.splice(0, messageQueue.length);
  };

  private reconnect = () => {
    if (this.forcedClose || this.disableReconnect) return;

    console.log("ws: reconnecting...");

    if (this.intervalRef) {
      window.clearInterval(this.intervalRef);
    }

    const TIMEOUT = Math.pow(2, this.retryAttempts + 1) * 1000;
    this.intervalRef = window.setInterval(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log("ws: reconnecting - attempt: ", this.reconnectAttempts);

        this.ws = new window.WebSocket(this.ws.url, this.protocols);
        this.ws.onopen = this.onRestore;
      } else {
        if (this.retryAttempts < this.maxRetryAttempts) {
          this.retryAttempts++;
          console.log("ws: retrying - attempt: ", this.retryAttempts);

          this.reconnectAttempts = 0;
          this.reconnect();
        } else {
          this.emit("reconnection_timeout");
          window.clearInterval(this.intervalRef);
        }
      }
    }, TIMEOUT);
  };

  private onRestore = () => {
    console.log("ws: connection restored!");
    this.reconnectAttempts = 0;
    window.clearInterval(this.intervalRef);

    this.emit("open");
    this.emit("reconnected");
    this.connect();
  };

  /** check if connection is open */
  public isOpen = () => this.ws.readyState === this.ws.OPEN;
}
