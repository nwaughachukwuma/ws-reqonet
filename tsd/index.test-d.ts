import { expectType } from "tsd";
import WSRekanet from "../index";

const url = "ws://localhost:3000";
const ws = new WSRekanet(url);
ws.on("open", () => {
  console.log("socket connection opened");
});

expectType<WSRekanet>(ws);
expectType<number>(ws.listeners("open").length);
expectType<void>(ws.send("test message"));
