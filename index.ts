import { EventEmitter } from "events";

export interface WebSocketReconnect {
  maxReconnectAttempts?: number;
  maxRetryAttempts?: number;
}
// a class object to handle websocket connection and reconnection with exponential back-off
export default class WSReconnect extends EventEmitter {
  private ws: WebSocket;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private intervalRef: number;
  private messageQueue: string[];
  private retryAttempts: number;
  private maxRetryAttempts: number;

  constructor(url: string, options?: WebSocketReconnect) {
    super();

    this.reconnectAttempts = 1;
    this.maxReconnectAttempts = options?.maxReconnectAttempts ?? 10;
    this.intervalRef = 0;
    this.messageQueue = [];
    this.retryAttempts = 0;
    this.maxRetryAttempts = options?.maxRetryAttempts ?? 3;

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
  };

  private onMessage = (event: MessageEvent<any>) => {
    this.emit("message", event);
  };

  private onError = (error: Event) => {
    this.emit("error", error);
  };

  private onClose = () => {
    this.emit("close");
  };

  public send = (data: string) => {
    if (this.ws.readyState === this.ws.OPEN) {
      this.ws.send(data);
    } else {
      this.messageQueue.push(data);
    }
  };

  public close = () => {
    // TODO: handle manual close on the client
    this.ws.close();
  };

  private connect = () => {
    this.ws.onclose = this.onClose;
    this.ws.onerror = this.onError;
    this.ws.onopen = this.onOpen;
    this.ws.onmessage = this.onMessage;

    // TODO: send with a slight delay to not overload the server
    this.messageQueue.forEach((message) => {
      this.ws.send(message);
    });

    this.messageQueue = [];
  };

  private reconnect = () => {
    console.log("ws: reconnecting...");

    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }

    this.intervalRef = window.setInterval(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log("ws: reconnecting - attempt: ", this.reconnectAttempts);

        this.ws.close();
        this.ws = new WebSocket(this.ws.url);
        this.ws.onopen = () => {
          console.log("ws: connection restored!", this.reconnectAttempts);

          this.reconnectAttempts = 1;
          this.initEventListeners();
          this.connect();

          clearInterval(this.intervalRef);
        };
      } else {
        if (this.retryAttempts < this.maxRetryAttempts) {
          this.retryAttempts++;
          console.log("ws: retrying - attempt: ", this.retryAttempts);

          this.reconnectAttempts = 1;
          this.reconnect();
        } else {
          clearInterval(this.intervalRef);
        }
      }
    }, Math.pow(2, this.retryAttempts + 1) * 1000);
  };
}
