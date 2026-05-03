import axios from "axios";

// obs: depois a gente troca essa URL quando for deployar
export const api = axios.create({
  baseURL: "http://localhost:3333/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// só pra garantir que está funcionando
console.log("[api] cliente axios inicializado");
