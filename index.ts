import { EventEmitter } from "events";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export interface WSReqonetOptions {
  /** # of times to reconnect within a retry */
  maxReconnectAttempts?: number;
  /** # of attempts at reconnecting */
  maxRetryAttempts?: number;
  /** Whether to store 'send' data when connection is broken  */
  queueMessage?: boolean;
  /** whether to disable reconnection */
  disableReconnect?: boolean;
  /** enable to get console.log output */
  debug?: boolean;
}
// websocket with reconnection on exponential back-off
export default class WSReqonet extends EventEmitter {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private retryAttempts = 0;
  private maxRetryAttempts: number;
  private intervalRef = 0;
  private messageQueue: Array<string | Blob | ArrayBuffer | ArrayBufferView> =
    [];
  private queueMessage: boolean;
  private forcedClose = false;
  private disableReconnect: boolean;
  constructor(
    url: string | URL,
    private protocols: string | string[] = [],
    options: WSReqonetOptions = {}
  ) {
    super();
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.maxRetryAttempts = options.maxRetryAttempts ?? 5;
    this.queueMessage = options.queueMessage ?? true;
    this.disableReconnect = options.disableReconnect ?? false;

    if (!options?.debug) {
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
    } else if (this.queueMessage) {
      this.messageQueue.push(data);
    }
  };
  public close: WebSocket["close"] = (code?: number, reason?: string) => {
    this.forcedClose = true;
    this.ws.close(code, reason);
  };
  private connect = () => {
    this.ws.onclose = this.onClose;
    this.ws.onerror = this.onError;
    this.ws.onopen = this.onOpen;
    this.ws.onmessage = this.onMessage;

    if (this.queueMessage) {
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
