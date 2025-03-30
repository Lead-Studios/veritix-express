import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayInit,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets"
import type { Server, Socket } from "socket.io"
import type { RedisService } from "../redis/redis.service"
import type { CheckInsService } from "../check-ins/check-ins.service"
import type { JwtService } from "@nestjs/jwt"
import { Logger } from "@nestjs/common"

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class DashboardGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(DashboardGateway.name)
  private eventRooms: Map<string, Set<string>> = new Map()

  constructor(
    private redisService: RedisService,
    private checkInsService: CheckInsService,
    private jwtService: JwtService,
  ) {}

  afterInit() {
    // Subscribe to Redis check-in channel
    this.redisService.subscribe("check-in", (message) => {
      try {
        const checkInData = JSON.parse(message)
        const eventId = checkInData.eventId

        // Emit to the specific event room
        this.server.to(`event:${eventId}`).emit("check-in", checkInData)

        // Update stats
        this.updateEventStats(eventId)
      } catch (error) {
        this.logger.error("Error processing check-in message", error)
      }
    })
  }

  async handleConnection(client: Socket) {
    try {
      // Authenticate the socket connection
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(" ")[1]

      if (!token) {
        client.disconnect()
        return
      }

      const decoded = this.jwtService.verify(token)
      client.data.user = decoded

      this.logger.log(`Client connected: ${client.id}`)
    } catch (error) {
      this.logger.error("Authentication failed", error)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    // Remove client from all event rooms
    for (const [eventId, clients] of this.eventRooms.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id)

        // If no clients left in the room, remove the room
        if (clients.size === 0) {
          this.eventRooms.delete(eventId)
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`)
  }

  // Handle client joining an event room
  async handleJoinEvent(client: Socket, eventId: string) {
    // Check if user has permission to access this event
    const user = client.data.user

    // Add logic to check if user is an organizer for this event
    // For simplicity, we're allowing any authenticated user to join

    // Join the room
    client.join(`event:${eventId}`)

    // Track clients in the room
    if (!this.eventRooms.has(eventId)) {
      this.eventRooms.set(eventId, new Set())
    }
    this.eventRooms.get(eventId).add(client.id)

    // Send initial stats
    await this.updateEventStats(eventId)
  }

  // Handle client leaving an event room
  handleLeaveEvent(client: Socket, eventId: string) {
    client.leave(`event:${eventId}`)

    if (this.eventRooms.has(eventId)) {
      this.eventRooms.get(eventId).delete(client.id)

      if (this.eventRooms.get(eventId).size === 0) {
        this.eventRooms.delete(eventId)
      }
    }
  }

  // Update and broadcast event stats
  private async updateEventStats(eventId: string) {
    try {
      const stats = await this.checkInsService.getCheckInStats(eventId)
      this.server.to(`event:${eventId}`).emit("stats", stats)
    } catch (error) {
      this.logger.error(`Error updating stats for event ${eventId}`, error)
    }
  }
}

