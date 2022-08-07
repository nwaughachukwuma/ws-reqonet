import { expectType } from "tsd";
import WSReqonet from "../index";

const url = "ws://localhost:3000";
const ws = new WSReqonet(url);
ws.on("open", () => {
  console.log("socket connection opened");
});

expectType<WSReqonet>(ws);
expectType<number>(ws.listeners("open").length);
expectType<void>(ws.send("test message"));
