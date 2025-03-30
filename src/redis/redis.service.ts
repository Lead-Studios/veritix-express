import { Injectable, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common"
import { createClient } from "redis"

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: ReturnType<typeof createClient>
  private publisher: ReturnType<typeof createClient>

  constructor() {
    // Create Redis clients
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    })

    this.publisher = this.client.duplicate()
  }

  async onModuleInit() {
    // Connect to Redis
    await this.client.connect()
    await this.publisher.connect()
  }

  async onModuleDestroy() {
    // Disconnect from Redis
    await this.client.disconnect()
    await this.publisher.disconnect()
  }

  async get(key: string): Promise<string> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, { EX: ttl })
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message)
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client.duplicate()
    await subscriber.connect()

    await subscriber.subscribe(channel, (message) => {
      callback(message)
    })
  }
}

