import { Injectable } from "@nestjs/common"
import * as QRCode from "qrcode"
import * as crypto from "crypto"

@Injectable()
export class QrCodeService {
  async generateQrCode(
    ticketId: string,
    eventId: string,
    userId: string,
  ): Promise<{ qrCodeUrl: string; qrCodeData: string }> {
    // Create a unique data payload for the QR code
    const qrCodeData = this.generateQrCodeData(ticketId, eventId, userId)

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData)

    return { qrCodeUrl, qrCodeData }
  }

  private generateQrCodeData(ticketId: string, eventId: string, userId: string): string {
    // Create a JSON payload with ticket information
    const payload = {
      ticketId,
      eventId,
      userId,
      timestamp: new Date().toISOString(),
    }

    // Sign the payload to prevent tampering
    const signature = this.signPayload(JSON.stringify(payload))

    return JSON.stringify({
      ...payload,
      signature,
    })
  }

  private signPayload(payload: string): string {
    // In a real application, use a secure key from environment variables
    const secret = process.env.QR_CODE_SECRET || "your-secret-key"
    return crypto.createHmac("sha256", secret).update(payload).digest("hex")
  }

  verifyQrCode(qrCodeData: string): { isValid: boolean; data?: any } {
    try {
      const parsedData = JSON.parse(qrCodeData)
      const { signature, ...payload } = parsedData

      // Recalculate signature to verify integrity
      const calculatedSignature = this.signPayload(JSON.stringify(payload))

      if (calculatedSignature === signature) {
        return { isValid: true, data: payload }
      }

      return { isValid: false }
    } catch (error) {
      return { isValid: false }
    }
  }
}

