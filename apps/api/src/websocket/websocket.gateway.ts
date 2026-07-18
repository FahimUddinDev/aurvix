import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Queue events ───────────────────────────────────────────────────────

  @SubscribeMessage('join:queue')
  handleJoinQueue(@MessageBody() data: { doctorId: string }, @ConnectedSocket() client: Socket) {
    client.join(`queue:${data.doctorId}`);
    this.logger.log(`Client ${client.id} joined queue:${data.doctorId}`);
  }

  emitQueueUpdate(doctorId: string, payload: unknown) {
    this.server.to(`queue:${doctorId}`).emit('queue:update', payload);
  }

  emitTokenCalled(doctorId: string, token: string) {
    this.server.to(`queue:${doctorId}`).emit('queue:token-called', { token });
  }

  // ── Bed board events ───────────────────────────────────────────────────

  @SubscribeMessage('join:bed-board')
  handleJoinBedBoard(
    @MessageBody() data: { hospitalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`beds:${data.hospitalId}`);
  }

  emitBedStatusUpdate(hospitalId: string, payload: unknown) {
    this.server.to(`beds:${hospitalId}`).emit('beds:update', payload);
  }

  // ── Notification events ────────────────────────────────────────────────

  emitUserNotification(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  @SubscribeMessage('join:user')
  handleJoinUser(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    client.join(`user:${data.userId}`);
  }
}
