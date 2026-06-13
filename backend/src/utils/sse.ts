import { Response } from "express";

interface Client {
  id: string;
  res: Response;
  userId: string;
}

let clients: Client[] = [];

export const addSseClient = (id: string, res: Response, userId: string) => {
  clients.push({ id, res, userId });
};

export const removeSseClient = (id: string) => {
  clients = clients.filter(c => c.id !== id);
};

export const broadcastToUser = (userId: string, data: any) => {
  const userClients = clients.filter(c => c.userId === userId);
  userClients.forEach(c => {
    c.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};
