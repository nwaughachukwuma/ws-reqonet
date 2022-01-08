import { EventEmitter } from "events";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface WebSocketReconnect {
  /** Number of times it attempts to reconnect within a retry */
  maxReconnectAttempts?: number;
  /** how many attempts at reconnecting */
  maxRetryAttempts?: number;
  /** Whether to store 'send' data when the connection is broken  */
  useMessageQueue?: boolean;
}
// websocket connection and reconnection with exponential back-off
export default class WSReconnect extends EventEmitter {
  private ws: WebSocket;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private retryAttempts: number;
  private maxRetryAttempts: number;
  private intervalRef: number;
  private messageQueue: Array<string | Blob | ArrayBuffer | ArrayBufferView>;
  private useMessageQueue: boolean;
  private forcedClose: boolean;

  constructor(url: string | URL, options?: WebSocketReconnect) {
    super();

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options?.maxReconnectAttempts ?? 5;
    this.intervalRef = 0;
    this.messageQueue = [];
    this.retryAttempts = 0;
    this.maxRetryAttempts = options?.maxRetryAttempts ?? 5;
    this.forcedClose = false;
    this.useMessageQueue = options?.useMessageQueue ?? true;

    this.ws = new WebSocket(url);

    this.initEventListeners();
    this.connect();
  }

  private initEventListeners() {
    this.ws.addEventListener("close", this.reconnect, { once: true });
    this.ws.addEventListener("error", this.reconnect, { once: true });
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
  };

  private onClose = () => {
    if (!this.forcedClose) {
      this.emit("close");
    }
  };

  /** send data to websocket server */
  public send = (data: string | Blob | ArrayBuffer | ArrayBufferView) => {
    if (this.isOpen()) {
      this.ws.send(data);
    } else if (this.useMessageQueue) {
      this.messageQueue.push(data);
    }
  };

  /** force close the connection */
  public close = () => {
    this.forcedClose = true;
    this.ws.close();
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
    if (this.forcedClose) return;

    console.log("ws: reconnecting...");

    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }

    const TIMEOUT = Math.pow(2, this.retryAttempts + 1) * 1000;
    this.intervalRef = window.setInterval(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log("ws: reconnecting - attempt: ", this.reconnectAttempts);

        this.ws.close();
        this.ws = new WebSocket(this.ws.url);
        this.ws.onopen = this.onRestore;
      } else {
        if (this.retryAttempts < this.maxRetryAttempts) {
          this.retryAttempts++;
          console.log("ws: retrying - attempt: ", this.retryAttempts);

          this.reconnectAttempts = 0;
          this.reconnect();
        } else {
          clearInterval(this.intervalRef);
        }
      }
    }, TIMEOUT);
  };

  private onRestore = () => {
    console.log("ws: connection restored!");

    this.reconnectAttempts = 0;
    this.initEventListeners();
    this.connect();

    clearInterval(this.intervalRef);
  };

  /** check if connection is open */
  public isOpen = () => this.ws.readyState === this.ws.OPEN;
}
