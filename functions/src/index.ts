// functions\src\index.ts

import * as functions from "firebase-functions";

// Exportar todas nuestras funciones Cloud
export * from "./sendNotifications";

// Función de prueba
export const helloWorld = functions.https.onRequest(
  (request: functions.https.Request, response: functions.Response<any>) => {
    response.send("¡Hola, mundo!");
  }
);

// Aquí puedes agregar más funciones según sea necesario
